
import type { Weather } from "@/lib/types";
import { WeatherForm } from "./weather-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface DailyLogHeaderProps {
  logDate: Date;
  weather: Weather;
  isDisabled: boolean;
  onWeatherChange: (newWeather: Weather) => void;
}

export function DailyLogHeader({ logDate, weather, isDisabled, onWeatherChange }: DailyLogHeaderProps) {
  return (
    <Card className={isDisabled ? 'opacity-70 bg-secondary/30' : ''}>
      <CardHeader className="bg-primary text-primary-foreground border-b p-3">
        <CardTitle className="font-headline text-lg">Meteo</CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <WeatherForm 
          initialWeather={weather} 
          date={logDate} 
          isDisabled={isDisabled}
          onWeatherChange={onWeatherChange}
        />
      </CardContent>
    </Card>
  );
}
