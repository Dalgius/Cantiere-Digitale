

'use client'

import type { DailyLog } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";

interface DailyLogNavProps {
    projectLogs: DailyLog[];
    projectId: string;
    activeDate: Date;
}

export function DailyLogNav({ projectLogs, projectId, activeDate }: DailyLogNavProps) {
    const router = useRouter();
    
    const logDates = projectLogs.map(log => new Date(log.date));

    const handleDateSelect = (date: Date | undefined) => {
        if (!date) return;
        const selectedDateString = format(date, 'yyyy-MM-dd');
        router.push(`/projects/${projectId}/${selectedDateString}`);
    };

    return (
        <Card>
            <CardContent className="p-0">
               <Calendar
                locale={it}
                mode="single"
                selected={activeDate}
                onSelect={handleDateSelect}
                modifiers={{
                    available: logDates,
                }}
                modifiersStyles={{
                    available: {
                        border: "2px solid hsl(var(--primary))",
                        fontWeight: 'bold',
                    }
                }}
               />
               <div className="text-xs text-muted-foreground p-3 border-t">
                    Seleziona una data per visualizzare il log.
               </div>
            </CardContent>
        </Card>
    );
}
