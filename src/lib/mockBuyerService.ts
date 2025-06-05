import { BuyerData, BuyerFormValues } from './buyerRepository';

// Mock buyer data for testing when database is not available
const mockBuyers: BuyerData[] = [
  {
    id: 'BUYER-001',
    buyerCode: 'B001',
    buyerName: 'Global Fashion Inc.',
    contactPerson: 'John Smith',
    email: 'john.smith@globalfashion.com',
    phone: '+1-555-0123',
    address: '123 Fashion Avenue, New York, NY 10001',
    country: 'USA',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  },
  {
    id: 'BUYER-002',
    buyerCode: 'B002',
    buyerName: 'European Styles Ltd.',
    contactPerson: 'Marie Dubois',
    email: 'marie.dubois@europeanstyles.eu',
    phone: '+33-1-23-45-67-89',
    address: '45 Rue de la Mode, 75001 Paris',
    country: 'France',
    createdAt: new Date('2024-01-16T11:30:00Z'),
    updatedAt: new Date('2024-01-16T11:30:00Z'),
  },
  {
    id: 'BUYER-003',
    buyerCode: 'B003',
    buyerName: 'Asian Apparel Co.',
    contactPerson: 'Hiroshi Tanaka',
    email: 'h.tanaka@asianapparel.jp',
    phone: '+81-3-1234-5678',
    address: '7-1-1 Ginza, Chuo-ku, Tokyo 104-0061',
    country: 'Japan',
    createdAt: new Date('2024-01-17T09:15:00Z'),
    updatedAt: new Date('2024-01-17T09:15:00Z'),
  },
  {
    id: 'BUYER-004',
    buyerCode: 'B004',
    buyerName: 'Fast Fashion Group',
    contactPerson: 'Sarah Wilson',
    email: 'sarah.wilson@fastfashion.com',
    phone: '+44-20-7123-4567',
    address: '100 Oxford Street, London W1C 1DX',
    country: 'United Kingdom',
    createdAt: new Date('2024-01-18T14:45:00Z'),
    updatedAt: new Date('2024-01-18T14:45:00Z'),
  },
  {
    id: 'BUYER-005',
    buyerCode: 'B005',
    buyerName: 'Casual Wear Express',
    contactPerson: 'Michael Brown',
    email: 'michael.brown@casualwear.com',
    phone: '+1-555-0456',
    address: '789 Commerce Street, Los Angeles, CA 90028',
    country: 'USA',
    createdAt: new Date('2024-01-19T16:20:00Z'),
    updatedAt: new Date('2024-01-19T16:20:00Z'),
  },
];

export class MockBuyerService {
  private static buyers: BuyerData[] = [...mockBuyers];

  static async findAll(): Promise<BuyerData[]> {
    // Simulate async delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return [...this.buyers].sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  static async findById(id: string): Promise<BuyerData | null> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return this.buyers.find(buyer => buyer.id === id) || null;
  }

  static async findByCode(buyerCode: string): Promise<BuyerData | null> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return this.buyers.find(buyer => buyer.buyerCode === buyerCode) || null;
  }

  static async create(buyerData: BuyerFormValues): Promise<BuyerData> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if buyer code already exists
    const existing = await this.findByCode(buyerData.buyerCode);
    if (existing) {
      throw new Error('Buyer code already exists');
    }

    const newBuyer: BuyerData = {
      id: `BUYER-${Date.now()}`,
      ...buyerData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.buyers.unshift(newBuyer);
    return newBuyer;
  }

  static async update(id: string, buyerData: BuyerFormValues): Promise<BuyerData> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const index = this.buyers.findIndex(buyer => buyer.id === id);
    if (index === -1) {
      throw new Error('Buyer not found');
    }

    // Check if buyer code already exists for different buyer
    const existing = await this.findByCode(buyerData.buyerCode);
    if (existing && existing.id !== id) {
      throw new Error('Buyer code already exists');
    }

    const updatedBuyer: BuyerData = {
      ...this.buyers[index],
      ...buyerData,
      updatedAt: new Date(),
    };

    this.buyers[index] = updatedBuyer;
    return updatedBuyer;
  }

  static async delete(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const index = this.buyers.findIndex(buyer => buyer.id === id);
    if (index === -1) {
      return false;
    }

    this.buyers.splice(index, 1);
    return true;
  }

  static async search(searchTerm: string): Promise<BuyerData[]> {
    await new Promise(resolve => setTimeout(resolve, 80));
    
    const term = searchTerm.toLowerCase();
    return this.buyers.filter(buyer =>
      buyer.buyerName.toLowerCase().includes(term) ||
      buyer.buyerCode.toLowerCase().includes(term) ||
      (buyer.contactPerson && buyer.contactPerson.toLowerCase().includes(term)) ||
      (buyer.country && buyer.country.toLowerCase().includes(term))
    ).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  static async codeExists(buyerCode: string, excludeId?: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 30));
    
    const existing = this.buyers.find(buyer => 
      buyer.buyerCode === buyerCode && (!excludeId || buyer.id !== excludeId)
    );
    
    return !!existing;
  }
}
