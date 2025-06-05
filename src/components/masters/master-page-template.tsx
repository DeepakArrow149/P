
'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import type { ReactNode } from 'react';

interface MasterPageTemplateProps {
  title: string;
  description: string;
  children: ReactNode;
  onAdd?: () => void; // Make onAdd optional
  addLabel?: string;  // Make addLabel optional
}

export function MasterPageTemplate({
  title,
  description,
  children,
  onAdd,
  addLabel, // Use the passed addLabel or a default if onAdd is present
}: MasterPageTemplateProps) {
  const effectiveAddLabel = addLabel || 'Add New'; // Default label if onAdd is provided but no addLabel

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          onAdd ? ( // Conditionally render button only if onAdd is provided
            <Button onClick={onAdd}>
              <PlusCircle className="mr-2 h-4 w-4" /> {effectiveAddLabel}
            </Button>
          ) : null
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>{title} Management</CardTitle>
          <CardDescription>
            Manage {title.toLowerCase()} settings and data.
          </CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </>
  );
}

