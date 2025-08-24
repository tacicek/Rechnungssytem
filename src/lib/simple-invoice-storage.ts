import { supabase } from '@/integrations/supabase/client';
import { Invoice } from '@/types';

export const simpleInvoiceStorage = {
  add: async (invoice: Invoice): Promise<void> => {
    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get vendor ID  
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('vendor_id')
      .eq('user_id', user.id)
      .single();
    
    if (!profile?.vendor_id) throw new Error('No vendor found');

    // Insert invoice - super simple
    const { data: newInvoice, error } = await supabase
      .from('invoices')
      .insert({
        invoice_no: invoice.number,
        customer_name: invoice.customerName,
        customer_email: invoice.customerEmail,
        vendor_id: profile.vendor_id,
        created_by: user.id,
        issue_date: invoice.date,
        due_date: invoice.dueDate,
        subtotal: invoice.subtotal,
        tax_total: invoice.taxTotal,
        total: invoice.total,
        status: invoice.status,
        notes: invoice.notes || '',
        currency: 'CHF'
      })
      .select('id')
      .single();

    if (error) {
      console.error('Simple invoice insert error:', error);
      throw new Error('Invoice could not be created');
    }

    // Insert items - also super simple
    if (invoice.items?.length > 0) {
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(
          invoice.items.map(item => ({
            invoice_id: newInvoice.id,
            created_by: user.id,
            description: item.description,
            qty: item.quantity,
            unit_price: item.unitPrice,
            tax_rate: item.taxRate || 0,
            line_total: item.total
          }))
        );

      if (itemsError) {
        console.error('Simple items insert error:', itemsError);
        throw new Error('Invoice items could not be created');
      }
    }
  }
};