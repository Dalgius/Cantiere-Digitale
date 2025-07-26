
// src/components/log/registered-resources-card.tsx
'use client';

import { useState, useEffect } from 'react';
import type { RegisteredResource, ResourceType } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';

interface RegisteredResourcesCardProps {
  projectId: string;
  resources: RegisteredResource[];
  onResourcesUpdated: (newResources: RegisteredResource[]) => void;
}

interface ResourceFormProps {
  resource?: RegisteredResource | null;
  onSave: (resource: Omit<RegisteredResource, 'id'> | RegisteredResource) => void;
  onClose: () => void;
}

function ResourceForm({ resource, onSave, onClose }: ResourceFormProps) {
  const [type, setType] = useState<ResourceType | ''>(resource?.type || '');
  const [description, setDescription] = useState(resource?.description || '');
  const [name, setName] = useState(resource?.name || '');
  const [company, setCompany] = useState(resource?.company || '');
  const { toast } = useToast();

  const handleSave = () => {
    if (!type || !description.trim() || !name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Campi obbligatori',
        description: 'Tipo, descrizione e nome/modello sono richiesti.',
      });
      return;
    }
    
    const resourceData = {
      type: type as ResourceType,
      description,
      name,
      company,
    };
    
    if (resource?.id) {
       onSave({ id: resource.id, ...resourceData });
    } else {
        onSave({ id: `reg-${Date.now()}`, ...resourceData });
    }
  };

  return (
    <>
       <DialogHeader>
        <DialogTitle>{resource ? 'Modifica Risorsa' : 'Aggiungi all\'Anagrafica'}</DialogTitle>
        <DialogDescription>
          {resource ? 'Correggi i dettagli di questa risorsa.' : 'Aggiungi una nuova risorsa riutilizzabile per questo progetto.'}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="type" className="text-right">Tipo</Label>
          <Select value={type} onValueChange={(v) => setType(v as ResourceType)}>
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
          <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" placeholder='Es. "Operaio Specializzato"' />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">Nome/Modello</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder='Es. "Mario Rossi" o "CAT 320"' />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="company" className="text-right">Impresa</Label>
          <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="(Opzionale)" className="col-span-3" />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>Annulla</Button>
        <Button type="button" onClick={handleSave}>Salva Risorsa</Button>
      </DialogFooter>
    </>
  );
}


export function RegisteredResourcesCard({ projectId, resources, onResourcesUpdated }: RegisteredResourcesCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<RegisteredResource | null>(null);

  const handleAddNew = () => {
    setEditingResource(null);
    setIsDialogOpen(true);
  };
  
  const handleEdit = (resource: RegisteredResource) => {
    setEditingResource(resource);
    setIsDialogOpen(true);
  };

  const handleDelete = (resourceId: string) => {
    const updatedResources = resources.filter(r => r.id !== resourceId);
    onResourcesUpdated(updatedResources);
  };

  const handleSave = (resourceData: Omit<RegisteredResource, 'id'> | RegisteredResource) => {
    let updatedResources;
    if ('id' in resourceData && resources.some(r => r.id === resourceData.id)) {
      // It's an update
      updatedResources = resources.map(r => r.id === resourceData.id ? resourceData : r);
    } else {
      // It's a new one
      const newResource = { ...resourceData, id: `reg-${Date.now()}` };
      updatedResources = [...resources, newResource];
    }
    onResourcesUpdated(updatedResources);
    setIsDialogOpen(false);
  };
  
  return (
    <Card>
      <CardHeader className="p-3">
        <CardTitle className="font-headline text-lg">Anagrafica</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-48">
          <div className="p-3 space-y-2">
            {resources.length > 0 ? resources.map(res => (
              <div key={res.id} className="text-sm flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <div className="flex-1">
                   <p className="font-medium">{res.description} - <strong>{res.name}</strong></p>
                   {res.company && <p className="text-xs text-muted-foreground">{res.company}</p>}
                </div>
                <div className="flex gap-1">
                   <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(res)}>
                      <Pencil className="h-4 w-4" />
                   </Button>
                   <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" onClick={() => handleDelete(res.id)}>
                      <Trash2 className="h-4 w-4" />
                   </Button>
                </div>
              </div>
            )) : (
              <p className="text-sm text-center text-muted-foreground p-4">Nessuna risorsa in anagrafica.</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
       <Separator />
       <CardFooter className="p-2">
          <Button variant="outline" size="sm" className="w-full" onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" /> Aggiungi all'Anagrafica
          </Button>
       </CardFooter>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
             <ResourceForm resource={editingResource} onSave={handleSave} onClose={() => setIsDialogOpen(false)} />
          </DialogContent>
      </Dialog>
    </Card>
  );
}
