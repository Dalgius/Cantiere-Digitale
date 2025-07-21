
'use client';

import type { Resource, ResourceType } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "../ui/button";
import { Plus, Trash2, Send } from "lucide-react";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "../ui/separator";

interface ResourcesTableProps {
  resources: Resource[];
  onAddResource: (resource: Omit<Resource, 'id'>) => void;
  onRemoveResource: (resourceId: string) => void;
  isDisabled: boolean;
}

function NewResourceForm({ onAddResource, isDisabled }: { onAddResource: ResourcesTableProps['onAddResource'], isDisabled: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<ResourceType | ''>('');
  const [description, setDescription] = useState('');
  const [company, setCompany] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  const handleAddResource = () => {
    if (!type || !description.trim() || quantity <= 0) {
      toast({
        variant: 'destructive',
        title: 'Campi obbligatori',
        description: 'Per favore, compila tutti i campi richiesti per aggiungere una risorsa.',
      });
      return;
    }

    onAddResource({
      type: type as ResourceType,
      description,
      company,
      quantity,
      notes,
    });
    
    // Reset form and close dialog
    setIsOpen(false);
    setType('');
    setDescription('');
    setCompany('');
    setQuantity(1);
    setNotes('');
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button disabled={isDisabled} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Aggiungi Risorsa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aggiungi Risorsa</DialogTitle>
          <DialogDescription>
            Registra una nuova risorsa impiegata nel cantiere per la data odierna.
          </DialogDescription>
        </DialogHeader>
        <fieldset disabled={isDisabled} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as ResourceType)}>
                <SelectTrigger className="col-span-3">
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
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="company" className="text-right">Impresa</Label>
            <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Es. Subappaltatore Srl" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">Quantità</Label>
            <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min="1" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">Note</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="col-span-3" />
          </div>
        </fieldset>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">Annulla</Button>
          </DialogClose>
          <Button type="button" onClick={handleAddResource} disabled={isDisabled}>Aggiungi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ResourcesTable({ resources, onAddResource, onRemoveResource, isDisabled }: ResourcesTableProps) {
  return (
    <Card className={isDisabled ? 'opacity-70 bg-secondary/30' : ''}>
      <CardHeader className="flex flex-row items-center justify-between bg-primary text-primary-foreground border-b">
        <CardTitle className="font-headline text-lg">Risorse Impiegate</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Descrizione</TableHead>
              <TableHead className="text-right">Q.tà</TableHead>
              <TableHead className="w-[50px]"></TableHead>
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
                    {resource.description}
                    {resource.company && <p className="text-xs text-muted-foreground font-normal">{resource.company}</p>}
                    {resource.notes && <p className="text-xs text-muted-foreground font-normal italic">{resource.notes}</p>}
                </TableCell>
                <TableCell className="text-right">{resource.quantity}</TableCell>
                <TableCell className="text-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onRemoveResource(resource.id)} disabled={isDisabled}>
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
          <NewResourceForm onAddResource={onAddResource} isDisabled={isDisabled} />
       </CardFooter>
    </Card>
  );
}
