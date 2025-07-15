
'use client';

import type { Resource, ResourceType } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
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

interface ResourcesTableProps {
  resources: Resource[];
  onAddResource: (resource: Omit<Resource, 'id'>) => void;
  isDisabled: boolean;
}

export function ResourcesTable({ resources, onAddResource, isDisabled }: ResourcesTableProps) {
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
    <Card className={isDisabled ? 'bg-secondary/30' : ''}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-headline text-lg">Risorse Impiegate</CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" disabled={isDisabled}>
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aggiungi Risorsa</DialogTitle>
              <DialogDescription>
                Registra una nuova risorsa impiegata nel cantiere per la data odierna.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Annulla</Button>
              </DialogClose>
              <Button type="button" onClick={handleAddResource}>Aggiungi Risorsa</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Descrizione</TableHead>
              <TableHead className="text-right">Q.tà</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.map((resource) => (
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
              </TableRow>
            ))}
             {resources.length === 0 && (
                <TableRow>
                    <TableCell colSpan={3} className="text-center h-24">Nessuna risorsa registrata.</TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
