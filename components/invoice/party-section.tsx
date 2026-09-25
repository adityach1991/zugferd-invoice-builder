import { Input } from "@/components/ui/input";
import type { Party } from "@/src/domain/invoice/types";

interface PartySectionProps {
  title: string;
  party: Party;
  onPartyChange: (party: Party) => void;
}

export function PartySection({ title, party, onPartyChange }: PartySectionProps) {
  const handleAddressChange = (field: keyof Party["address"], value: string) => {
    onPartyChange({
      ...party,
      address: {
        ...party.address,
        [field]: value,
      },
    });
  };

  const handleContactChange = (field: keyof NonNullable<Party["contact"]>, value: string) => {
    onPartyChange({
      ...party,
      contact: {
        ...party.contact,
        [field]: value,
      },
    });
  };

  return (
    <div className="mb-6 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Name"
          value={party.name}
          onChange={(e) => onPartyChange({...party, name: e.target.value})}
          required
        />
        
        <Input
          label="Legal Name (Optional)"
          value={party.legalName || ""}
          onChange={(e) => onPartyChange({...party, legalName: e.target.value})}
        />
        
        <Input
          label="VAT ID (Optional)"
          value={party.vatId || ""}
          onChange={(e) => onPartyChange({...party, vatId: e.target.value})}
        />
        
        <Input
          label="Tax Number (Optional)"
          value={party.taxNumber || ""}
          onChange={(e) => onPartyChange({...party, taxNumber: e.target.value})}
        />
      </div>

      <div className="mt-4">
        <h4 className="font-medium mb-2">Address</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Address Line 1"
            value={party.address.line1}
            onChange={(e) => handleAddressChange("line1", e.target.value)}
            required
          />
          <Input
            label="Address Line 2 (Optional)"
            value={party.address.line2 || ""}
            onChange={(e) => handleAddressChange("line2", e.target.value)}
          />
          <Input
            label="Postal Code"
            value={party.address.postalCode}
            onChange={(e) => handleAddressChange("postalCode", e.target.value)}
            required
          />
          <Input
            label="City"
            value={party.address.city}
            onChange={(e) => handleAddressChange("city", e.target.value)}
            required
          />
          <Input
            label="Country"
            value={party.address.country}
            onChange={(e) => handleAddressChange("country", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="mt-4">
        <h4 className="font-medium mb-2">Contact (Optional)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Contact Name"
            value={party.contact?.name || ""}
            onChange={(e) => handleContactChange("name", e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={party.contact?.email || ""}
            onChange={(e) => handleContactChange("email", e.target.value)}
          />
          <Input
            label="Phone"
            value={party.contact?.phone || ""}
            onChange={(e) => handleContactChange("phone", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}