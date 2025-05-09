
import Layout from '@/components/Layout';
import { 
  Card, 
  CardContent,  
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Clock, 
  Coffee, 
  Heart,
  Info, 
  MapPin, 
  Phone,
  ThumbsUp, 
  Users 
} from 'lucide-react';

const AboutUs = () => {
  return (
    <Layout>
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">About Bean & Brew</h1>
            <p className="text-lg text-muted-foreground">
              A story of passion for coffee and community
            </p>
          </div>
          
          <div className="mb-12">
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Info className="h-6 w-6 text-coffee-medium" />
                  Our Story
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <p>
                  Bean & Brew was founded in 2018 with a simple mission: to serve the best coffee in Nairobi while creating a warm, welcoming space for our community. What started as a small corner café has grown into a beloved local institution.
                </p>
                <p>
                  Our journey began when our founder, Sarah Kamau, returned to Kenya after studying coffee cultivation and roasting techniques abroad. Combining traditional Kenyan coffee heritage with modern brewing methods, we created a unique coffee experience that honors our roots while embracing innovation.
                </p>
                <p>
                  Today, we source our beans directly from small-scale farmers across Kenya's coffee regions, ensuring fair compensation for quality harvests while supporting sustainable farming practices.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 mb-12">
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="flex items-center gap-2">
                  <Coffee className="h-5 w-5 text-coffee-medium" />
                  Our Coffee
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p>
                  We source premium Arabica beans from Kenya's highlands, focusing on sustainable and ethical partnerships with local farmers. Our master roaster carefully crafts each batch to perfection, bringing out the complex flavors that make Kenyan coffee world-renowned.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-coffee-medium" />
                  Our Values
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p>
                  At Bean & Brew, we believe in quality without compromise, community support, environmental responsibility, and creating authentic connections. These core values guide every decision we make—from sourcing beans to serving our customers.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center">Why Choose Us</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <div className="bg-coffee-light h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ThumbsUp className="h-6 w-6 text-coffee-dark" />
                </div>
                <h3 className="font-bold mb-2">Quality First</h3>
                <p className="text-muted-foreground text-sm">
                  We never compromise on the quality of our ingredients or preparations.
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <div className="bg-coffee-light h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-coffee-dark" />
                </div>
                <h3 className="font-bold mb-2">Community Focused</h3>
                <p className="text-muted-foreground text-sm">
                  We support local farmers and create a welcoming space for our neighborhood.
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <div className="bg-coffee-light h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-coffee-dark" />
                </div>
                <h3 className="font-bold mb-2">Consistency</h3>
                <p className="text-muted-foreground text-sm">
                  Every cup, every pastry, every time—we deliver the same great experience.
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold mb-6 text-center">Visit Us</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3 mb-4">
                    <MapPin className="h-5 w-5 text-coffee-medium mt-0.5" />
                    <div>
                      <h3 className="font-bold mb-1">Main Location</h3>
                      <p className="text-muted-foreground">
                        123 Kimathi Street, Nairobi CBD<br />
                        Nairobi, Kenya
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-coffee-medium mt-0.5" />
                    <div>
                      <h3 className="font-bold mb-1">Opening Hours</h3>
                      <p className="text-muted-foreground">
                        Monday - Friday: 7:00 AM - 8:00 PM<br />
                        Saturday - Sunday: 8:00 AM - 9:00 PM
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3 mb-4">
                    <MapPin className="h-5 w-5 text-coffee-medium mt-0.5" />
                    <div>
                      <h3 className="font-bold mb-1">Westlands Branch</h3>
                      <p className="text-muted-foreground">
                        456 Waiyaki Way, Westlands<br />
                        Nairobi, Kenya
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-coffee-medium mt-0.5" />
                    <div>
                      <h3 className="font-bold mb-1">Opening Hours</h3>
                      <p className="text-muted-foreground">
                        Monday - Friday: 7:00 AM - 9:00 PM<br />
                        Saturday - Sunday: 8:00 AM - 10:00 PM
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AboutUs;
