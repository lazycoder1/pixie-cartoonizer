
import React from "react";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselPrevious, 
  CarouselNext 
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const showcaseExamples = [
  {
    id: 1,
    title: "Portrait Transformation",
    description: "Turn your portraits into vibrant cartoon characters",
    before: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&q=80&w=800",
    after: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&q=80&w=800&duotone=582c83,f7e5f4&duotone-alpha=90"
  },
  {
    id: 2,
    title: "Professional Stylization",
    description: "Perfect for professional profile pictures with a creative twist",
    before: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800",
    after: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800&duotone=5c2d91,f8f0ff&duotone-alpha=85"
  },
  {
    id: 3,
    title: "Creative Designs",
    description: "Transform ordinary photos into extraordinary artwork",
    before: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=800",
    after: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=800&duotone=6e22b9,f7e8ff&duotone-alpha=80"
  },
];

const BeforeAfterShowcase = () => {
  return (
    <div className="w-full py-12 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-4">See the Magic in Action</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Check out these amazing transformations created with our AI cartoonizer. 
            Your photos could be next!
          </p>
        </div>

        <Carousel className="w-full max-w-5xl mx-auto">
          <CarouselContent>
            {showcaseExamples.map((example) => (
              <CarouselItem key={example.id}>
                <div className="p-1">
                  <Card>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold">{example.title}</h3>
                        <p className="text-muted-foreground">{example.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="space-y-2">
                            <div className="relative aspect-square overflow-hidden rounded-md">
                              <img 
                                src={example.before} 
                                alt="Original image" 
                                className="object-cover w-full h-full"
                              />
                              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                Before
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="relative aspect-square overflow-hidden rounded-md">
                              <img 
                                src={example.after} 
                                alt="Cartoonized image" 
                                className="object-cover w-full h-full"
                              />
                              <div className="absolute bottom-2 left-2 bg-brand-purple text-white text-xs px-2 py-1 rounded">
                                After
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-0 lg:-left-12" />
          <CarouselNext className="right-0 lg:-right-12" />
        </Carousel>
      </div>
    </div>
  );
};

export default BeforeAfterShowcase;
