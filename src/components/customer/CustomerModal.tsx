import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Customer } from '@/types/index';

const customerSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  contactPerson: z.string().optional(),
  contactGender: z.enum(['male', 'female', 'neutral']).optional(),
  email: z.string().email('Gültige E-Mail-Adresse erforderlich'),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxNumber: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CustomerFormData) => Promise<void>;
  customer?: Customer | null;
  isLoading?: boolean;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  customer,
  isLoading = false,
}) => {
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name || '',
      contactPerson: customer?.contactPerson || '',
      contactGender: customer?.contactGender || undefined,
      email: customer?.email || '',
      phone: customer?.phone || '',
      address: customer?.address || '',
      taxNumber: customer?.taxNumber || '',
    },
  });

  React.useEffect(() => {
    if (isOpen && customer) {
      form.reset({
        name: customer.name,
        contactPerson: customer.contactPerson || '',
        contactGender: customer.contactGender || undefined,
        email: customer.email,
        phone: customer.phone || '',
        address: customer.address || '',
        taxNumber: customer.taxNumber || '',
      });
    } else if (isOpen && !customer) {
      form.reset({
        name: '',
        contactPerson: '',
        contactGender: undefined,
        email: '',
        phone: '',
        address: '',
        taxNumber: '',
      });
    }
  }, [isOpen, customer, form]);

  const handleSubmit = async (data: CustomerFormData) => {
    try {
      await onSave(data);
      onClose();
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {customer ? 'Kunde bearbeiten' : 'Neuen Kunden erstellen'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Firmenname *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Firmenname eingeben" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ansprechpartner</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Name der Kontaktperson" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactGender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anrede</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Anrede wählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Herr</SelectItem>
                        <SelectItem value="female">Frau</SelectItem>
                        <SelectItem value="neutral">Neutral</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-Mail *</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="kunde@beispiel.de" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefon</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="+41 XX XXX XX XX" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Strasse, PLZ Ort, Land" 
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taxNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Steuernummer</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="CHE-123.456.789" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Speichern...' : customer ? 'Aktualisieren' : 'Erstellen'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};