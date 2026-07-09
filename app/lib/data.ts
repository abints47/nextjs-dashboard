import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';
import { revenue, invoices, customers } from './placeholder-data';

export async function fetchRevenue() {
  try {
    // Artificially delay a response for demo purposes.
    // Don't do this in production :)
    console.log('Fetching revenue data...');
    await new Promise((resolve) => setTimeout(resolve, 3000));
    console.log('Data fetch completed after 3 seconds.');

    return revenue;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  try {
    // Sort invoices by date desc
    const sortedInvoices = [...invoices].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    // Take top 5
    const top5 = sortedInvoices.slice(0, 5);
    // Join with customers
    const latestInvoices = top5.map((invoice) => {
      const originalIndex = invoices.indexOf(invoice);
      const customer = customers.find((c) => c.id === invoice.customer_id);
      return {
        id: `inv-${originalIndex}`,
        name: customer ? customer.name : '',
        image_url: customer ? customer.image_url : '',
        email: customer ? customer.email : '',
        amount: formatCurrency(invoice.amount),
      };
    });
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  try {
    const numberOfInvoices = invoices.length;
    const numberOfCustomers = customers.length;

    let paid = 0;
    let pending = 0;
    for (const inv of invoices) {
      if (inv.status === 'paid') {
        paid += inv.amount;
      } else if (inv.status === 'pending') {
        pending += inv.amount;
      }
    }

    const totalPaidInvoices = formatCurrency(paid);
    const totalPendingInvoices = formatCurrency(pending);

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    // Join invoices with customers and filter
    const joined = invoices.map((invoice, index) => {
      const customer = customers.find((c) => c.id === invoice.customer_id);
      return {
        id: `inv-${index}`,
        customer_id: invoice.customer_id,
        amount: invoice.amount,
        date: invoice.date,
        status: invoice.status as 'pending' | 'paid',
        name: customer ? customer.name : '',
        email: customer ? customer.email : '',
        image_url: customer ? customer.image_url : '',
      };
    });

    const lowerQuery = query.toLowerCase();
    const filtered = joined.filter((item) => {
      return (
        item.name.toLowerCase().includes(lowerQuery) ||
        item.email.toLowerCase().includes(lowerQuery) ||
        item.amount.toString().includes(lowerQuery) ||
        item.date.includes(lowerQuery) ||
        item.status.toLowerCase().includes(lowerQuery)
      );
    });

    // Sort by date DESC
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Paginate
    const paginated = filtered.slice(offset, offset + ITEMS_PER_PAGE);
    return paginated;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    const lowerQuery = query.toLowerCase();
    const filtered = invoices.filter((invoice) => {
      const customer = customers.find((c) => c.id === invoice.customer_id);
      const name = customer ? customer.name.toLowerCase() : '';
      const email = customer ? customer.email.toLowerCase() : '';
      return (
        name.includes(lowerQuery) ||
        email.includes(lowerQuery) ||
        invoice.amount.toString().includes(lowerQuery) ||
        invoice.date.includes(lowerQuery) ||
        invoice.status.toLowerCase().includes(lowerQuery)
      );
    });

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const match = id.match(/^inv-(\d+)$/);
    if (!match) return undefined;
    const index = parseInt(match[1], 10);
    const invoice = invoices[index];
    if (!invoice) return undefined;

    return {
      id: id,
      customer_id: invoice.customer_id,
      amount: invoice.amount / 100, // convert from cents to dollars
      status: invoice.status as 'pending' | 'paid',
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
    const fields = customers.map((c) => ({
      id: c.id,
      name: c.name,
    }));
    fields.sort((a, b) => a.name.localeCompare(b.name));
    return fields;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  try {
    const lowerQuery = query.toLowerCase();
    const filteredCustomers = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.email.toLowerCase().includes(lowerQuery),
    );

    const data = filteredCustomers.map((customer) => {
      const customerInvoices = invoices.filter((i) => i.customer_id === customer.id);
      const total_invoices = customerInvoices.length;
      let total_pending = 0;
      let total_paid = 0;
      for (const inv of customerInvoices) {
        if (inv.status === 'pending') {
          total_pending += inv.amount;
        } else if (inv.status === 'paid') {
          total_paid += inv.amount;
        }
      }
      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        image_url: customer.image_url,
        total_invoices,
        total_pending: formatCurrency(total_pending),
        total_paid: formatCurrency(total_paid),
      };
    });

    data.sort((a, b) => a.name.localeCompare(b.name));
    return data;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}
