import { BuyerData, BuyerFormValues } from './buyerRepository';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

// File path for persistent mock data
const MOCK_DATA_FILE = join(process.cwd(), 'tmp', 'mock-buyers.json');

// Initial mock buyer data
const initialMockBuyers: BuyerData[] = [
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

export class PersistentMockBuyerService {
  private static ensureTmpDir(): void {
    const tmpDir = join(process.cwd(), 'tmp');
    if (!existsSync(tmpDir)) {
      try {
        require('fs').mkdirSync(tmpDir, { recursive: true });
      } catch (error) {
        console.warn('Could not create tmp directory, using in-memory storage');
      }
    }
  }

  private static loadBuyers(): BuyerData[] {
    this.ensureTmpDir();
    
    try {
      if (existsSync(MOCK_DATA_FILE)) {
        const data = readFileSync(MOCK_DATA_FILE, 'utf8');
        const buyers = JSON.parse(data);
        // Convert string dates back to Date objects
        return buyers.map((buyer: any) => ({
          ...buyer,
          createdAt: new Date(buyer.createdAt),
          updatedAt: new Date(buyer.updatedAt),
        }));
      }
    } catch (error) {
      console.warn('Could not load mock data file, using initial data');
    }
    
    // Return initial data if file doesn't exist or can't be read
    this.saveBuyers(initialMockBuyers);
    return [...initialMockBuyers];
  }

  private static saveBuyers(buyers: BuyerData[]): void {
    try {
      this.ensureTmpDir();
      writeFileSync(MOCK_DATA_FILE, JSON.stringify(buyers, null, 2));
    } catch (error) {
      console.warn('Could not save mock data file:', error);
    }
  }

  static async findAll(): Promise<BuyerData[]> {
    // Simulate async delay
    await new Promise(resolve => setTimeout(resolve, 100));
    const buyers = this.loadBuyers();
    return buyers.sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  static async findById(id: string): Promise<BuyerData | null> {
    await new Promise(resolve => setTimeout(resolve, 50));
    const buyers = this.loadBuyers();
    return buyers.find(buyer => buyer.id === id) || null;
  }

  static async findByCode(buyerCode: string): Promise<BuyerData | null> {
    await new Promise(resolve => setTimeout(resolve, 50));
    const buyers = this.loadBuyers();
    return buyers.find(buyer => buyer.buyerCode === buyerCode) || null;
  }

  static async create(buyerData: BuyerFormValues): Promise<BuyerData> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const buyers = this.loadBuyers();
    
    // Check if buyer code already exists
    const existing = buyers.find(buyer => buyer.buyerCode === buyerData.buyerCode);
    if (existing) {
      throw new Error('Buyer code already exists');
    }

    const newBuyer: BuyerData = {
      id: `BUYER-${Date.now()}`,
      ...buyerData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    buyers.unshift(newBuyer);
    this.saveBuyers(buyers);
    return newBuyer;
  }

  static async update(id: string, buyerData: BuyerFormValues): Promise<BuyerData> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const buyers = this.loadBuyers();
    const index = buyers.findIndex(buyer => buyer.id === id);
    if (index === -1) {
      throw new Error('Buyer not found');
    }

    // Check if buyer code already exists for different buyer
    const existing = buyers.find(buyer => buyer.buyerCode === buyerData.buyerCode && buyer.id !== id);
    if (existing) {
      throw new Error('Buyer code already exists');
    }

    const updatedBuyer: BuyerData = {
      ...buyers[index],
      ...buyerData,
      updatedAt: new Date(),
    };

    buyers[index] = updatedBuyer;
    this.saveBuyers(buyers);
    return updatedBuyer;
  }

  static async delete(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const buyers = this.loadBuyers();
    const index = buyers.findIndex(buyer => buyer.id === id);
    if (index === -1) {
      return false;
    }

    buyers.splice(index, 1);
    this.saveBuyers(buyers);
    return true;
  }

  static async search(searchTerm: string): Promise<BuyerData[]> {
    await new Promise(resolve => setTimeout(resolve, 80));
    
    const buyers = this.loadBuyers();
    const term = searchTerm.toLowerCase();
    return buyers.filter(buyer =>
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
    
    const buyers = this.loadBuyers();
    const existing = buyers.find(buyer => 
      buyer.buyerCode === buyerCode && (!excludeId || buyer.id !== excludeId)
    );
    
    return !!existing;
  }
}

// Export as MockBuyerService for compatibility
export const MockBuyerService = PersistentMockBuyerService;
