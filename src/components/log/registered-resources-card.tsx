
'use client';

import { useState } from 'react';
import type { RegisteredResource, ResourceType } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Users, Truck } from 'lucide-react';
import { Separator } from '../ui/separator';

interface RegisteredResourcesCardProps {
  projectId: string;
  registeredResources: RegisteredResource[];
  onUpdateResources: (updatedResources: RegisteredResource[]) => void;
}

function NewResourceDialog({ onAddResource }: { onAddResource: (resource: Omit<RegisteredResource, 'id'>) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<ResourceType | ''>('');
  const [description, setDescription] = useState('');
  const [company, setCompany] = useState('');
  const { toast } = useToast();

  const handleAdd = () => {
    if (!type || !description.trim()) {
      toast({
        variant: 'destructive',
        title: 'Campi obbligatori',
        description: 'Tipo e descrizione sono richiesti.',
      });
      return;
    }
    onAddResource({ type, description, company });
    setIsOpen(false);
    setType('');
    setDescription('');
    setCompany('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Aggiungi all'Anagrafica
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuova Risorsa in Anagrafica</DialogTitle>
          <DialogDescription>
            Aggiungi una nuova risorsa che potrai riutilizzare nei log giornalieri.
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
            <Label htmlFor="company" className="text-right">Impresa</Label>
            <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} className="col-span-3" placeholder="(Opzionale)" />
          </div>
        </div>
        <DialogFooter>
           <DialogClose asChild>
            <Button type="button" variant="ghost">Annulla</Button>
          </DialogClose>
          <Button onClick={handleAdd}>Aggiungi Risorsa</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RegisteredResourcesCard({ registeredResources, onUpdateResources }: RegisteredResourcesCardProps) {
  
  const handleAddResource = (newResourceData: Omit<RegisteredResource, 'id'>) => {
    const newResource: RegisteredResource = {
      ...newResourceData,
      id: `reg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    onUpdateResources([...registeredResources, newResource]);
  };

  const handleRemoveResource = (resourceId: string) => {
    const updatedResources = registeredResources.filter(r => r.id !== resourceId);
    onUpdateResources(updatedResources);
  };
  
  const manpower = registeredResources.filter(r => r.type === 'Manodopera');
  const equipment = registeredResources.filter(r => r.type === 'Macchinario/Mezzo');

  return (
    <Card>
      <CardContent className="space-y-4 max-h-60 overflow-y-auto p-4">
        {registeredResources.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">L'anagrafica è vuota. Aggiungi risorse dal log giornaliero.</p>
        ) : (
          <>
            {manpower.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-2"><Users className="h-4 w-4 text-primary" /> Manodopera</h4>
                <div className="space-y-1">
                  {manpower.map(resource => (
                    <div key={resource.id} className="flex items-center justify-between text-sm group">
                      <span className="truncate" title={`${resource.description} ${resource.company ? `(${resource.company})` : ''}`}>
                        {resource.description} {resource.company && <span className="text-xs text-muted-foreground">({resource.company})</span>}
                      </span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleRemoveResource(resource.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
             {equipment.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-2 mt-3"><Truck className="h-4 w-4 text-primary" /> Mezzi e Macchinari</h4>
                <div className="space-y-1">
                  {equipment.map(resource => (
                    <div key={resource.id} className="flex items-center justify-between text-sm group">
                      <span className="truncate" title={resource.description}>
                        {resource.description} {resource.company && <span className="text-xs text-muted-foreground">({resource.company})</span>}
                        </span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleRemoveResource(resource.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
      <Separator />
      <CardFooter className="p-2">
        <NewResourceDialog onAddResource={handleAddResource} />
      </CardFooter>
    </Card>
  );
}
