
import type { Weather } from "@/lib/types";
import { WeatherForm } from "./weather-form";

interface DailyLogHeaderProps {
  logDate: Date;
  weather: Weather;
  isDisabled: boolean;
  onWeatherChange: (newWeather: Weather) => void;
}

export function DailyLogHeader({ logDate, weather, isDisabled, onWeatherChange }: DailyLogHeaderProps) {
  return (
    <header className="space-y-4">
      <div className={`bg-card p-4 rounded-lg border transition-opacity ${isDisabled ? 'opacity-70 bg-secondary/30' : ''}`}>
          <WeatherForm 
            initialWeather={weather} 
            date={logDate} 
            isDisabled={isDisabled}
            onWeatherChange={onWeatherChange}
          />
      </div>
    </header>
  );
}
