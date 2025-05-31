// src/app/ai-assistant/page.tsx
"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Sparkles, Lightbulb, Wrench } from 'lucide-react'; // Changed Tool to Wrench
import { suggestSolutions, type SuggestSolutionsOutput } from '@/ai/flows/suggest-solutions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

const formSchema = z.object({
  problemDescription: z.string().min(20, {
    message: "Please describe your problem in at least 20 characters.",
  }).max(1000, {
    message: "Problem description must not exceed 1000 characters.",
  }),
});

type FormData = z.infer<typeof formSchema>;

export default function AiAssistantPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<SuggestSolutionsOutput | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      problemDescription: "",
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setError(null);
    setAiResponse(null);
    try {
      const response = await suggestSolutions({ problemDescription: data.problemDescription });
      setAiResponse(response);
    } catch (err) {
      console.error("AI Assistant Error:", err);
      setError("Sorry, something went wrong while getting suggestions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <Sparkles className="mx-auto h-16 w-16 text-accent mb-4" />
          <CardTitle className="text-3xl font-headline">AI Solution Assistant</CardTitle>
          <CardDescription>
            Describe your home maintenance problem, and our AI will suggest potential solutions and relevant handyman skills.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="problemDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Your Problem Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., My kitchen sink is leaking, or I need to install a new ceiling fan..."
                        rows={5}
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Getting Suggestions...
                  </>
                ) : (
                  <>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Get Suggestions
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>

        {error && (
          <CardFooter>
            <Alert variant="destructive" className="w-full">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardFooter>
        )}

        {aiResponse && (
          <CardFooter className="flex flex-col items-start gap-4 pt-6">
            <Separator />
            <h3 className="text-xl font-semibold font-headline text-primary">AI Suggestions:</h3>
            
            {aiResponse.suggestedSolutions && aiResponse.suggestedSolutions.length > 0 && (
              <div className="w-full p-4 border rounded-md bg-background">
                <h4 className="text-lg font-medium mb-2 flex items-center"><Lightbulb className="text-yellow-500 mr-2 h-5 w-5" />Potential Solutions:</h4>
                <ul className="list-disc list-inside space-y-1 text-foreground/90">
                  {aiResponse.suggestedSolutions.map((solution, index) => (
                    <li key={`sol-${index}`}>{solution}</li>
                  ))}
                </ul>
              </div>
            )}

            {aiResponse.relevantSkills && aiResponse.relevantSkills.length > 0 && (
               <div className="w-full p-4 border rounded-md bg-background">
                <h4 className="text-lg font-medium mb-2 flex items-center"><Wrench className="text-gray-600 mr-2 h-5 w-5" />Relevant Handyman Skills:</h4>
                <div className="flex flex-wrap gap-2">
                  {aiResponse.relevantSkills.map((skill, index) => (
                    <span key={`skill-${index}`} className="px-3 py-1 text-sm bg-accent/20 text-accent-foreground rounded-full border border-accent/50">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
             <Button variant="link" asChild className="mt-4 self-center">
                <Link href="/handymen">Find a Handyman with these skills &rarr;</Link>
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
