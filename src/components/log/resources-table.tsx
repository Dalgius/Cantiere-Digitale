
'use client';

import type { Resource, ResourceType, RegisteredResource } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "../ui/button";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "../ui/separator";

interface ResourcesTableProps {
  resources: Resource[];
  registeredResources: RegisteredResource[];
  onAddResource: (resource: Omit<Resource, 'id'>) => void;
  onUpdateResource: (resource: Resource) => void;
  onRemoveResource: (resourceId: string, removeFromAnagrafica: boolean) => void;
  isDisabled: boolean;
}

interface ResourceFormProps {
  resource?: Resource | null;
  onSave: (resourceData: Omit<Resource, 'id'> | Resource) => void;
  onClose: () => void;
  registeredResources: RegisteredResource[];
}

function ResourceForm({ resource, onSave, onClose, registeredResources }: ResourceFormProps) {
  const { toast } = useToast();

  const [type, setType] = useState<ResourceType | ''>(resource?.type || '');
  const [description, setDescription] = useState(resource?.description || '');
  const [name, setName] = useState(resource?.name || '');
  const [company, setCompany] = useState(resource?.company || '');
  const [quantity, setQuantity] = useState(resource?.quantity || 1);
  const [notes, setNotes] = useState(resource?.notes || '');
  const [selectedRegisteredId, setSelectedRegisteredId] = useState<string | undefined>(resource?.registeredResourceId);
  
  const resetForm = () => {
    setType('');
    setDescription('');
    setName('');
    setCompany('');
    setQuantity(1);
    setNotes('');
    setSelectedRegisteredId(undefined);
  };
  
  const handleSelectRegisteredResource = (resourceId: string) => {
    const selected = registeredResources.find(r => r.id === resourceId);
    if (selected) {
      setSelectedRegisteredId(selected.id);
      setType(selected.type);
      setDescription(selected.description);
      setName(selected.name);
      setCompany(selected.company || '');
    }
  };

  const handleSave = () => {
    if (!type || !description.trim() || !name.trim() || quantity <= 0) {
      toast({
        variant: 'destructive',
        title: 'Campi obbligatori',
        description: 'Tipo, descrizione, nome/modello e quantità sono richiesti.',
      });
      return;
    }

    const commonData = {
      registeredResourceId: selectedRegisteredId,
      type: type as ResourceType,
      description,
      name,
      company,
      quantity,
      notes,
    };
    
    if (resource?.id) {
       onSave({ id: resource.id, ...commonData });
    } else {
       onSave(commonData);
    }
    
    onClose();
  };

  // Reset form when dialog is closed/opened
  useEffect(() => {
    if (resource) {
        setType(resource.type || '');
        setDescription(resource.description || '');
        setName(resource.name || '');
        setCompany(resource.company || '');
        setQuantity(resource.quantity || 1);
        setNotes(resource.notes || '');
        setSelectedRegisteredId(resource.registeredResourceId);
    } else {
        resetForm();
    }
  }, [resource]);
  
  return (
    <>
      <DialogHeader>
        <DialogTitle>{resource ? 'Modifica Risorsa' : 'Aggiungi Risorsa'}</DialogTitle>
        <DialogDescription>
          {resource 
            ? "Modifica i dettagli di questa risorsa. La modifica si rifletterà nell'anagrafica." 
            : "Scegli una risorsa dall'anagrafica o inseriscine una nuova. Verrà salvata per usi futuri."}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        {registeredResources.length > 0 && !resource && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="registered-resource" className="text-right">Da Anagrafica</Label>
            <Select name="registered-resource-select" onValueChange={handleSelectRegisteredResource}>
              <SelectTrigger id="registered-resource" className="col-span-3">
                <SelectValue placeholder="Scegli risorsa..." />
              </SelectTrigger>
              <SelectContent>
                {registeredResources.map(res => (
                  <SelectItem key={res.id} value={res.id}>
                    {res.description} - {res.name} {res.company ? `(${res.company})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="type" className="text-right">Tipo</Label>
          <Select name="resource-type" id="resource-type" value={type} onValueChange={(v) => setType(v as ResourceType)}>
            <SelectTrigger id="type" className="col-span-3">
              <SelectValue placeholder="Seleziona tipo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Manodopera">Manodopera</SelectItem>
              <SelectItem value="Macchinario/Mezzo">Macchinario/Mezzo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="description" className="text-right">Descrizione</Label>
          <Input id="description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" placeholder='Es. "Operaio Specializzato o Escavatore"' />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">Nome/Modello</Label>
          <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder='Es. "Mario Rossi" o "CAT 320"'/>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="company" className="text-right">Impresa</Label>
          <Input id="company" name="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="(Opzionale)" className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="quantity" className="text-right">Quantità</Label>
          <Input id="quantity" name="quantity" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min="1" className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="notes" className="text-right">Note</Label>
          <Textarea id="notes" name="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="col-span-3" />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>Annulla</Button>
        <Button type="button" onClick={handleSave}>{resource ? "Salva Modifiche" : "Aggiungi"}</Button>
      </DialogFooter>
    </>
  )
}

export function ResourcesTable({ resources, registeredResources, onAddResource, onUpdateResource, onRemoveResource, isDisabled }: ResourcesTableProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);

  const handleOpenForm = (resource: Resource | null = null) => {
    setEditingResource(resource);
    setIsFormOpen(true);
  }
  
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingResource(null);
  }

  const handleSave = (resourceData: Omit<Resource, 'id'> | Resource) => {
    if ('id' in resourceData) {
      onUpdateResource(resourceData);
    } else {
      onAddResource(resourceData);
    }
  }

  const handleDeleteRequest = (resource: Resource) => {
    setResourceToDelete(resource);
  }
  
  const handleConfirmDelete = (fromAnagrafica: boolean) => {
    if (resourceToDelete) {
      onRemoveResource(resourceToDelete.id, fromAnagrafica);
    }
    setResourceToDelete(null);
  }

  return (
    <Card className={isDisabled ? 'opacity-70 bg-secondary/30' : ''}>
      <CardHeader className="flex flex-row items-center justify-between bg-primary text-primary-foreground border-b p-3">
        <CardTitle className="font-headline text-lg">Risorse Impiegate</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Descrizione</TableHead>
              <TableHead className="text-right">Q.tà</TableHead>
              <TableHead className="w-[100px] text-center">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.length > 0 ? resources.map((resource) => (
              <TableRow key={resource.id}>
                <TableCell>
                  <Badge variant={resource.type === 'Manodopera' ? 'secondary' : 'outline'}>
                    {resource.type}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                    <div>{resource.description} - <strong>{resource.name}</strong></div>
                    {resource.company && <p className="text-xs text-muted-foreground font-normal">{resource.company}</p>}
                    {resource.notes && <p className="text-xs text-muted-foreground font-normal italic">{resource.notes}</p>}
                </TableCell>
                <TableCell className="text-right">{resource.quantity}</TableCell>
                <TableCell className="text-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleOpenForm(resource)} disabled={isDisabled}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteRequest(resource)} disabled={isDisabled}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </TableCell>
              </TableRow>
            )) : (
                <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">Nessuna risorsa registrata.</TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
      </CardContent>
       <Separator />
       <CardFooter className="p-4 flex justify-end">
          <Button disabled={isDisabled} onClick={() => handleOpenForm()}>
            <Plus className="mr-2 h-4 w-4" />
            Aggiungi Risorsa
          </Button>
       </CardFooter>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
            <ResourceForm 
              resource={editingResource}
              onSave={handleSave}
              onClose={handleCloseForm}
              registeredResources={registeredResources}
            />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!resourceToDelete} onOpenChange={() => setResourceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Eliminazione Risorsa</AlertDialogTitle>
            <AlertDialogDescription>
              Vuoi eliminare la risorsa <span className="font-bold">"{resourceToDelete?.description} - {resourceToDelete?.name}"</span> solo da questo log giornaliero, o anche dall'anagrafica del progetto?
              <br/><br/>
              <span className="text-destructive">L'eliminazione dall'anagrafica è permanente.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel onClick={() => setResourceToDelete(null)}>Annulla</AlertDialogCancel>
            <Button variant="outline" onClick={() => handleConfirmDelete(false)}>
              Elimina solo da oggi
            </Button>
            <AlertDialogAction 
              onClick={() => handleConfirmDelete(true)} 
              className="bg-destructive hover:bg-destructive/90"
            >
              Elimina anche da Anagrafica
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
