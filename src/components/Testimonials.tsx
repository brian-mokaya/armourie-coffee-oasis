
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  image: string;
  quote: string;
  rating: number;
}

const Testimonials = () => {
  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Coffee Enthusiast",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
      quote: "Café Armourié has the best cappuccino in the city! The atmosphere is so calming, and the staff are always friendly. It's my favorite spot to work remotely.",
      rating: 5
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Local Resident",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
      quote: "I come here every weekend for their amazing avocado toast and smoothies. The loyalty program is a great bonus, and I love how they source ethically.",
      rating: 4
    },
    {
      id: 3,
      name: "Amina Kimani",
      role: "Digital Nomad",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
      quote: "As someone who works from cafés often, I can say that Café Armourié offers the perfect blend of comfort, good coffee, and stable Wi-Fi. Their seasonal drinks are always a treat!",
      rating: 5
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-coffee-dark text-center mb-12">
          What Our Customers Say
        </h2>

        <div className="relative max-w-4xl mx-auto">
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="w-full flex-shrink-0 px-4">
                  <div className="bg-coffee-cream p-8 rounded-lg">
                    <div className="flex items-center mb-4">
                      {[...Array(5)].map((_, i) => (
                        <svg 
                          key={i} 
                          className={`w-5 h-5 ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    
                    <blockquote>
                      <p className="text-coffee-dark text-lg italic mb-6">"{testimonial.quote}"</p>
                      <div className="flex items-center">
                        <img 
                          src={testimonial.image} 
                          alt={testimonial.name} 
                          className="w-12 h-12 rounded-full mr-4 object-cover"
                        />
                        <div>
                          <p className="font-semibold text-coffee-dark">{testimonial.name}</p>
                          <p className="text-coffee-medium">{testimonial.role}</p>
                        </div>
                      </div>
                    </blockquote>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button 
            variant="outline" 
            size="icon"
            className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 bg-white border-coffee-medium text-coffee-dark hover:bg-coffee-light hover:text-coffee-dark md:flex hidden"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon"
            className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 bg-white border-coffee-medium text-coffee-dark hover:bg-coffee-light hover:text-coffee-dark md:flex hidden"
            onClick={nextSlide}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex justify-center mt-8 md:hidden">
          <div className="flex space-x-2">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                className={`w-3 h-3 rounded-full ${
                  idx === currentIndex ? 'bg-coffee-dark' : 'bg-coffee-light'
                }`}
                onClick={() => setCurrentIndex(idx)}
              ></button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
