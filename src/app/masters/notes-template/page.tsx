'use client';

import { MasterPageTemplate } from '@/components/masters/master-page-template';
import { NotebookText } from 'lucide-react';

export default function NotesTemplateMasterPage() {
  return (
    <MasterPageTemplate
      title="Notes Templates"
      description="Manage predefined templates for notes."
      addLabel="Add New Template" // Added onClick prop to the button
      onAdd={() => console.log('Add New Template button clicked')} // Placeholder console log
    >
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-md">
        <NotebookText className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Notes templates will be displayed here.</p>
        <p className="text-sm text-muted-foreground">Click "Add New Template" to create reusable notes.</p>
      </div>
    </MasterPageTemplate>
  );
}
