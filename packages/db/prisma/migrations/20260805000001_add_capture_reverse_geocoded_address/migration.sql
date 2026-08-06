-- Add reverse-geocoded street address to LocationCapture so a GPS capture can
-- carry a Nominatim-derived street address, shown in the Resolve drawer and
-- applied to the terminal's addressLine1 on approve (fallback: hierarchy label).
ALTER TABLE "location_capture" ADD COLUMN "reverse_geocoded_address" TEXT;
