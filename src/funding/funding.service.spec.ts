import { Test, TestingModule } from '@nestjs/testing';
import { FundingService } from './funding.service';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from './stripe.service';
import { LedgerService } from './ledger.service';
import { VirtualAccountsService } from './virtual-accounts.service';

describe('FundingService Idempotency', () => {
  let service: FundingService;
  let prisma: PrismaService;

  const mockPrisma = {
    funding: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    project: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    reward: {
      update: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
  };

  const mockStripe = {
    createCheckoutSession: jest.fn(),
  };

  const mockLedger = {
    createEntries: jest.fn(),
  };

  const mockVirtualAccounts = {
    findByAccountNumber: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FundingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StripeService, useValue: mockStripe },
        { provide: LedgerService, useValue: mockLedger },
        { provide: VirtualAccountsService, useValue: mockVirtualAccounts },
      ],
    }).compile();

    service = module.get<FundingService>(FundingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should not process funding if it is already COMPLETED', async () => {
    const sessionId = 'sess_123';
    const fundingId = 'fund_123';
    
    mockPrisma.funding.findUnique.mockResolvedValue({
      id: fundingId,
      status: 'COMPLETED',
      stripePaymentId: sessionId,
    });

    await service.handleCheckoutCompleted(sessionId, 'pi_123');

    // The transaction should not be called if already completed
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('should process funding if it is PENDING and mark it COMPLETED', async () => {
    const sessionId = 'sess_123';
    const fundingId = 'fund_123';
    const projectId = 'proj_123';
    
    // First call (check outside transaction)
    mockPrisma.funding.findUnique
      .mockResolvedValueOnce({
        id: fundingId,
        status: 'PENDING',
        stripePaymentId: sessionId,
        projectId,
        amount: 100,
      })
      // Second call (check inside transaction)
      .mockResolvedValueOnce({
        id: fundingId,
        status: 'PENDING',
        projectId,
        amount: 100,
      });

    mockPrisma.project.findUnique.mockResolvedValue({
      id: projectId,
      currentAmount: 100,
      goalAmount: 500,
    });

    await service.handleCheckoutCompleted(sessionId, 'pi_123');

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(mockPrisma.funding.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: fundingId },
      data: { status: 'COMPLETED', stripePaymentId: 'pi_123' },
    }));
  });
});
