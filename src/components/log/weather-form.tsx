'use client'

import type { Weather } from "@/lib/types";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Calendar as CalendarIcon, Sun, Cloud, CloudRain, Snowflake, Thermometer } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "../ui/label";

interface WeatherFormProps {
  initialWeather: Weather;
  date: Date;
  isDisabled: boolean;
  onWeatherChange: (newWeather: Weather) => void;
}

export function WeatherForm({ initialWeather, date: initialDate, isDisabled, onWeatherChange }: WeatherFormProps) {
  const [date, setDate] = useState<Date>(initialDate);
  const [weather, setWeather] = useState<Weather>(initialWeather);

  // Sync with parent component's state
  useEffect(() => {
    setWeather(initialWeather);
  }, [initialWeather]);

  // Notify parent of changes
  const handleWeatherChange = (field: keyof Weather, value: any) => {
    const newWeather = { ...weather, [field]: value };
    setWeather(newWeather);
    onWeatherChange(newWeather);
  };
  
  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate)
      // Note: Date changes should be handled by the parent via router, not here.
    }
  }


  return (
    <fieldset disabled={isDisabled} className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
      <div className="space-y-2">
        <Label htmlFor="date-popover">Data</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date-popover"
              variant={"outline"}
              className="w-full justify-start text-left font-normal"
              disabled={true} // Date is controlled by the URL now
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP", { locale: it }) : <span>Scegli una data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateChange}
              initialFocus
              locale={it}
              disabled={true}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="weather-state">Stato</Label>
        <Select value={weather.state} onValueChange={(v) => handleWeatherChange('state', v as Weather['state'])} disabled={isDisabled}>
          <SelectTrigger id="weather-state">
            <SelectValue placeholder="Seleziona stato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Sole"><Sun className="inline-block mr-2 h-4 w-4 text-yellow-500" />Sole</SelectItem>
            <SelectItem value="Variabile"><Cloud className="inline-block mr-2 h-4 w-4 text-gray-400" />Variabile</SelectItem>
            <SelectItem value="Nuvoloso"><Cloud className="inline-block mr-2 h-4 w-4 text-gray-500" />Nuvoloso</SelectItem>
            <SelectItem value="Pioggia"><CloudRain className="inline-block mr-2 h-4 w-4 text-blue-500" />Pioggia</SelectItem>
            <SelectItem value="Neve"><Snowflake className="inline-block mr-2 h-4 w-4 text-blue-300" />Neve</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="temperature">Temperatura</Label>
        <div className="relative">
            <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                id="temperature"
                name="temperature"
                type="number" 
                value={weather.temperature} 
                onChange={(e) => handleWeatherChange('temperature', parseInt(e.target.value) || 0)}
                className="pl-8"
                disabled={isDisabled}
                />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">°C</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="precipitation">Precipitazioni</Label>
        <Select value={weather.precipitation} onValueChange={(v) => handleWeatherChange('precipitation', v as Weather['precipitation'])} disabled={isDisabled}>
          <SelectTrigger id="precipitation">
            <SelectValue placeholder="Seleziona precipitazioni" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Assenti">Assenti</SelectItem>
            <SelectItem value="Deboli">Deboli</SelectItem>
            <SelectItem value="Moderate">Moderate</SelectItem>
            <SelectItem value="Forti">Forti</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </fieldset>
  );
}
