import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Linkedin, Twitter, Instagram, Facebook } from "lucide-react";

interface SocialLinksFormSectionProps {
  socialLinks: {
    linkedin: string;
    twitter: string;
    instagram: string;
    facebook: string;
  };
  onSocialLinkChange: (
    platform: keyof SocialLinksFormSectionProps["socialLinks"],
    value: string
  ) => void;
}

const SocialLinksFormSection = ({
  socialLinks,
  onSocialLinkChange,
}: SocialLinksFormSectionProps) => {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center">
          <Linkedin className="h-4 w-4 mr-2 text-blue-600" />
          <Label htmlFor="linkedin">LinkedIn</Label>
        </div>
        <Input
          id="linkedin"
          value={socialLinks.linkedin}
          onChange={(e) => onSocialLinkChange('linkedin', e.target.value)}
          placeholder="https://linkedin.com/in/username"
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center">
          <Twitter className="h-4 w-4 mr-2 text-blue-400" />
          <Label htmlFor="twitter">Twitter</Label>
        </div>
        <Input
          id="twitter"
          value={socialLinks.twitter}
          onChange={(e) => onSocialLinkChange('twitter', e.target.value)}
          placeholder="https://twitter.com/username"
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center">
          <Instagram className="h-4 w-4 mr-2 text-pink-500" />
          <Label htmlFor="instagram">Instagram</Label>
        </div>
        <Input
          id="instagram"
          value={socialLinks.instagram}
          onChange={(e) => onSocialLinkChange('instagram', e.target.value)}
          placeholder="https://instagram.com/username"
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center">
          <Facebook className="h-4 w-4 mr-2 text-blue-500" />
          <Label htmlFor="facebook">Facebook</Label>
        </div>
        <Input
          id="facebook"
          value={socialLinks.facebook}
          onChange={(e) => onSocialLinkChange('facebook', e.target.value)}
          placeholder="https://facebook.com/username"
        />
      </div>
    </div>
  );
};

export default SocialLinksFormSection;
