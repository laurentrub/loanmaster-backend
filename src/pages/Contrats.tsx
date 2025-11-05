import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilePlus, FileSignature } from "lucide-react";

const Contrats = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contrats</h1>
            <p className="text-muted-foreground mt-2">Génération et suivi des contrats</p>
          </div>
          <Button>
            <FilePlus className="h-4 w-4 mr-2" />
            Nouveau contrat
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contrats en cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <FileSignature className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun contrat en cours</p>
              <p className="text-sm mt-2">Les contrats générés apparaîtront ici</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Contrats;
