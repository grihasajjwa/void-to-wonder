import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AddChequeDialog } from '@/components/AddChequeDialog';
import { EditChequeDialog } from '@/components/EditChequeDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Cheque {
  id: string;
  type: 'received' | 'issued';
  cheque_number: string;
  cheque_date: string;
  amount: number;
  bank_name: string;
  status: 'pending' | 'processing' | 'cleared' | 'bounced';
  bank_transaction_id: string | null;
  bounce_charges: number;
  mahajan_id: string | null;
  firm_account_id: string | null;
  party_name: string | null;
  notes: string | null;
  cleared_date: string | null;
}

export default function Cheques() {
  const { user } = useAuth();
  const [receivedCheques, setReceivedCheques] = useState<Cheque[]>([]);
  const [issuedCheques, setIssuedCheques] = useState<Cheque[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCheque, setSelectedCheque] = useState<Cheque | null>(null);
  const [chequeType, setChequeType] = useState<'received' | 'issued'>('received');

  useEffect(() => {
    if (user) {
      fetchCheques();
    }
  }, [user]);

  const fetchCheques = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cheques')
        .select('*')
        .eq('user_id', user?.id)
        .order('cheque_date', { ascending: false });

      if (error) throw error;

      const received = data?.filter((c) => c.type === 'received') || [];
      const issued = data?.filter((c) => c.type === 'issued') || [];
      
      setReceivedCheques(received);
      setIssuedCheques(issued);
    } catch (error: any) {
      toast.error('Error fetching cheques: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCheque) return;

    try {
      const { error } = await supabase
        .from('cheques')
        .delete()
        .eq('id', selectedCheque.id);

      if (error) throw error;

      toast.success('Cheque deleted successfully');
      fetchCheques();
      setDeleteDialogOpen(false);
      setSelectedCheque(null);
    } catch (error: any) {
      toast.error('Error deleting cheque: ' + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      processing: 'secondary',
      cleared: 'default',
      bounced: 'destructive',
    };
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  const renderChequeTable = (cheques: Cheque[], type: 'received' | 'issued') => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cheque No.</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Bank</TableHead>
          {type === 'received' ? <TableHead>Party</TableHead> : <TableHead>Mahajan</TableHead>}
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cheques.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground">
              No cheques found
            </TableCell>
          </TableRow>
        ) : (
          cheques.map((cheque) => (
            <TableRow key={cheque.id}>
              <TableCell className="font-medium">{cheque.cheque_number}</TableCell>
              <TableCell>{new Date(cheque.cheque_date).toLocaleDateString()}</TableCell>
              <TableCell>₹{cheque.amount.toLocaleString()}</TableCell>
              <TableCell>{cheque.bank_name}</TableCell>
              <TableCell>{cheque.party_name || '-'}</TableCell>
              <TableCell>{getStatusBadge(cheque.status)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedCheque(cheque);
                      setEditDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {cheque.status !== 'cleared' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedCheque(cheque);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Cheque Management</h1>
      </div>

      <Tabs defaultValue="received" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="received">Received Cheques</TabsTrigger>
          <TabsTrigger value="issued">Issued Cheques</TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setChequeType('received');
                setAddDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Received Cheque
            </Button>
          </div>
          {renderChequeTable(receivedCheques, 'received')}
        </TabsContent>

        <TabsContent value="issued" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setChequeType('issued');
                setAddDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Issued Cheque
            </Button>
          </div>
          {renderChequeTable(issuedCheques, 'issued')}
        </TabsContent>
      </Tabs>

      <AddChequeDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        type={chequeType}
        onSuccess={fetchCheques}
      />

      {selectedCheque && (
        <EditChequeDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          cheque={selectedCheque}
          onSuccess={fetchCheques}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cheque</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this cheque? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
