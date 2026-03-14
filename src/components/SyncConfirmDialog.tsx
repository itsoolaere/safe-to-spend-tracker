import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface SyncConfirmDialogProps {
  open: boolean;
  guestCount: number;
  onSync: () => void;
  onDiscard: () => void;
}

export default function SyncConfirmDialog({ open, guestCount, onSync, onDiscard }: SyncConfirmDialogProps) {
  if (!open) return null;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="w-[calc(100%-3rem)] sm:max-w-lg rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-heading">sync guest data?</AlertDialogTitle>
          <AlertDialogDescription>
            you have {guestCount} {guestCount === 1 ? "entry" : "entries"} from your guest session. 
            would you like to add them to your account, or start fresh?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col gap-3 sm:flex-col">
          <Button onClick={onSync}>
            sync my data
          </Button>
          <Button variant="outline" onClick={onDiscard}>
            start fresh
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
