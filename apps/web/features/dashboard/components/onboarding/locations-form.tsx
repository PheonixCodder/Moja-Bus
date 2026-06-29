"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import { Checkbox } from "@moja/ui/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@moja/ui/components/ui/card";
import { Plus, Trash2, Flag, MapPin, Phone, User, Clock, Home } from "lucide-react";

type Location = {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: string;
  longitude: string;
  phone: string;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
  isPrimary: boolean;
  operatingHours: string;
  isActive: boolean;
};

export function LocationsForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const [locations, setLocations] = useState<Location[]>([{
    id: crypto.randomUUID(),
    name: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Cote d'Ivoire",
    latitude: "",
    longitude: "",
    phone: "",
    managerName: "",
    managerPhone: "",
    managerEmail: "",
    isPrimary: true,
    operatingHours: "08:00-18:00",
    isActive: true,
  }]);

  const addLocation = () => {
    setLocations([...locations, {
      id: crypto.randomUUID(),
      name: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Cote d'Ivoire",
      latitude: "",
      longitude: "",
      phone: "",
      managerName: "",
      managerPhone: "",
      managerEmail: "",
      isPrimary: false,
      operatingHours: "08:00-18:00",
      isActive: true,
    }]);
  };

  const removeLocation = (id: string) => {
    if (locations.length <= 1) {
      toast.error("You must have at least one location");
      return;
    }
    setLocations(locations.filter(loc => loc.id !== id));
  };

  const updateLocation = (id: string, field: keyof Location, value: string | boolean) => {
    setLocations(locations.map(loc => 
      loc.id === id ? { ...loc, [field]: value } : loc
    ));
    
    // If setting as primary, unset others
    if (field === "isPrimary" && value === true) {
      setLocations(locations.map(loc => 
        loc.id === id ? loc : { ...loc, isPrimary: false }
      ));
    }
  };

  const canSubmit = locations.every(loc => 
    loc.name && loc.addressLine1 && loc.city && loc.phone
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    
    try {
      // TODO: Save locations data
      console.log("Locations data:", locations);
      
      toast.success("Locations saved!");
      router.push("/dashboard/operator/onboarding/documents");
    } catch (error) {
      toast.error("Failed to save locations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-amber-100 bg-amber-50/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-lg">
              <Flag className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Primary Location</CardTitle>
              <CardDescription>
                Your main depot or terminal - this will be shown as your primary address
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm font-medium text-slate-700 mb-4">Main Depot</p>
          {locations.map((location, index) => (
            <div key={location.id} className="space-y-4 border border-slate-200 rounded-lg p-4">
              {index > 0 && (
                <div className="flex items-center justify-between -mt-4 -mx-4 mb-4 pt-4 border-t border-slate-200">
                  <p className="text-sm font-medium text-slate-700">
                    Additional Location {index + 1}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLocation(location.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`name-${location.id}`} className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>Location Name</span>
                    {index === 0 && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id={`name-${location.id}`}
                    value={location.name}
                    onChange={(e) => updateLocation(location.id, "name", e.target.value)}
                    placeholder={index === 0 ? "Main Depot" : "Secondary Depot"}
                    required={index === 0}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`isPrimary-${location.id}`} className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    <span>Primary Location</span>
                  </Label>
                  <Checkbox
                    id={`isPrimary-${location.id}`}
                    checked={location.isPrimary}
                    onCheckedChange={(checked) => updateLocation(location.id, "isPrimary", checked)}
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`addressLine1-${location.id}`} className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Street Address</span>
                  {index === 0 && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id={`addressLine1-${location.id}`}
                  value={location.addressLine1}
                  onChange={(e) => updateLocation(location.id, "addressLine1", e.target.value)}
                  placeholder="123 Main Street"
                  required={index === 0}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`addressLine2-${location.id}`}>Address Line 2 (Optional)</Label>
                <Input
                  id={`addressLine2-${location.id}`}
                  value={location.addressLine2}
                  onChange={(e) => updateLocation(location.id, "addressLine2", e.target.value)}
                  placeholder="Building, Floor, Unit"
                  disabled={isLoading}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`city-${location.id}`} className="flex items-center gap-2">
                    <span>City</span>
                    {index === 0 && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id={`city-${location.id}`}
                    value={location.city}
                    onChange={(e) => updateLocation(location.id, "city", e.target.value)}
                    placeholder="Abidjan"
                    required={index === 0}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`state-${location.id}`}>State/Region</Label>
                  <Input
                    id={`state-${location.id}`}
                    value={location.state}
                    onChange={(e) => updateLocation(location.id, "state", e.target.value)}
                    placeholder="Lagunes"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`postalCode-${location.id}`}>Postal Code</Label>
                  <Input
                    id={`postalCode-${location.id}`}
                    value={location.postalCode}
                    onChange={(e) => updateLocation(location.id, "postalCode", e.target.value)}
                    placeholder="00000"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`phone-${location.id}`} className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>Location Phone</span>
                    {index === 0 && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id={`phone-${location.id}`}
                    value={location.phone}
                    onChange={(e) => updateLocation(location.id, "phone", e.target.value)}
                    placeholder="+225 XX XX XX XX"
                    required={index === 0}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`country-${location.id}`} className="flex items-center gap-2">
                    <span>Country</span>
                  </Label>
                  <Select
                    value={location.country}
                    onValueChange={(value) => updateLocation(location.id, "country", value || "")}
                    disabled={isLoading}
                  >
                    <SelectTrigger id={`country-${location.id}`}>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cote d'Ivoire">Cote d'Ivoire</SelectItem>
                      <SelectItem value="Ghana">Ghana</SelectItem>
                      <SelectItem value="Nigeria">Nigeria</SelectItem>
                      <SelectItem value="Senegal">Senegal</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="border-t border-slate-100 pt-4 mt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Location Manager</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`managerName-${location.id}`} className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Manager Name</span>
                    </Label>
                    <Input
                      id={`managerName-${location.id}`}
                      value={location.managerName}
                      onChange={(e) => updateLocation(location.id, "managerName", e.target.value)}
                      placeholder="John Doe"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`managerPhone-${location.id}`} className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>Manager Phone</span>
                    </Label>
                    <Input
                      id={`managerPhone-${location.id}`}
                      value={location.managerPhone}
                      onChange={(e) => updateLocation(location.id, "managerPhone", e.target.value)}
                      placeholder="+225 XX XX XX XX"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`managerEmail-${location.id}`} className="flex items-center gap-2">
                      <span>Manager Email</span>
                    </Label>
                    <Input
                      id={`managerEmail-${location.id}`}
                      type="email"
                      value={location.managerEmail}
                      onChange={(e) => updateLocation(location.id, "managerEmail", e.target.value)}
                      placeholder="manager@company.com"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 mt-4">
                <div className="space-y-2">
                  <Label htmlFor={`operatingHours-${location.id}`} className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Operating Hours</span>
                  </Label>
                  <Input
                    id={`operatingHours-${location.id}`}
                    value={location.operatingHours}
                    onChange={(e) => updateLocation(location.id, "operatingHours", e.target.value)}
                    placeholder="e.g., 08:00-18:00"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`isActive-${location.id}`} className="flex items-center gap-2">
                    <span>Active Location</span>
                  </Label>
                  <Checkbox
                    id={`isActive-${location.id}`}
                    checked={location.isActive}
                    onCheckedChange={(checked) => updateLocation(location.id, "isActive", checked)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Add location button */}
      <Button
        type="button"
        variant="outline"
        onClick={addLocation}
        className="w-full flex items-center justify-center gap-2"
        disabled={isLoading}
      >
        <Plus className="w-4 h-4" />
        Add Another Location
      </Button>

      {/* Submit */}
      <div className="flex justify-between items-center">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/dashboard/operator/onboarding/company")}
          disabled={isLoading}
        >
          Back
        </Button>
        <Button
          type="submit"
          size="lg"
          className="bg-amber-600 hover:bg-amber-700 text-white min-w-48"
          disabled={isLoading || !canSubmit}
        >
          {isLoading ? "Saving..." : "Continue to Documents"}
        </Button>
      </div>
    </form>
  );
}
