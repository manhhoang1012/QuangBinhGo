import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { generateItinerary } from "@/services/aiApi";

interface ItineraryScheduleItem {
  time: string;
  title: string;
  description: string;
}

interface ItineraryDay {
  day: number;
  theme: string;
  schedule: ItineraryScheduleItem[];
}

interface ItineraryResponse {
  overview: string;
  itinerary: ItineraryDay[];
}

export function AiItineraryPage() {
  const [days, setDays] = useState(3);
  const [interests, setInterests] = useState("caves, beach, food");
  const [travelStyle, setTravelStyle] = useState("relaxed");
  const [budget, setBudget] = useState("mid-range");
  const [itinerary, setItinerary] = useState<ItineraryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setError(null);
    try {
      setItinerary(await generateItinerary({
        days,
        interests: interests.split(",").map((item) => item.trim()).filter(Boolean),
        travel_style: travelStyle,
        budget,
      }));
    } catch {
      setError("Could not generate itinerary.");
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold">AI itinerary generator</h1>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <Input onChange={(event) => setDays(Number(event.target.value))} type="number" value={days} />
        <Input onChange={(event) => setInterests(event.target.value)} value={interests} />
        <Input onChange={(event) => setTravelStyle(event.target.value)} value={travelStyle} />
        <Input onChange={(event) => setBudget(event.target.value)} value={budget} />
      </div>
      <Button className="mt-4" onClick={() => void handleGenerate()}>Generate itinerary</Button>
      {error && <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">{error}</div>}
      {itinerary && (
        <div className="mt-8 grid gap-4">
          <p className="text-muted-foreground">{itinerary.overview}</p>
          {itinerary.itinerary.map((day) => (
            <Card key={day.day}>
              <CardContent className="pt-5">
                <h2 className="text-xl font-semibold">{day.theme}</h2>
                <div className="mt-4 space-y-3">
                  {day.schedule.map((item) => (
                    <p className="text-sm text-muted-foreground" key={`${day.day}-${item.time}`}>
                      <span className="font-medium text-foreground">{item.time}</span> {item.title}: {item.description}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
