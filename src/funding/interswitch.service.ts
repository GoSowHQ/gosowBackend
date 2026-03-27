import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { createServiceResponse, ServiceResponse } from '../common/types/service-response.type';

type InterswitchVirtualAccountResponse = {
  accountNumber?: string;
  accountName?: string;
  bankCode?: string;
  bankName?: string;
  payableCode?: string;
  requestReference?: string;
  responseCode?: string;
  [key: string]: unknown;
};

type InterswitchPayoutResponse = {
  transactionReference?: string;
  transactionId?: string;
  status?: string;
  responseCode?: string;
  [key: string]: unknown;
};

@Injectable()
export class InterswitchService {
  constructor(private config: ConfigService) {}

  async createVirtualAccount(params: {
    projectId: string;
    projectTitle: string;
    creatorName: string;
  }): Promise<ServiceResponse> {
    if (this.isMockMode()) {
      return createServiceResponse(
        this.mockVirtualAccount(params.projectId, params.projectTitle),
        'Mock virtual account created'
      );
    }

    const response = await this.request<InterswitchVirtualAccountResponse>(
      this.config.get<string>('INTERSWITCH_COLLECTIONS_URL') ||
        'https://sandbox.interswitchng.com/paymentgateway/api/v1/payable/virtualaccount',
      {
        method: 'POST',
        body: {
          requestReference: `proj_${params.projectId}`,
          payableCode: this.required('INTERSWITCH_PAYABLE_CODE'),
          accountName: `${params.projectTitle} - ${params.creatorName}`.slice(0, 30),
        },
      },
    );

    return createServiceResponse(
      {
        accountNumber: String(response.accountNumber),
        accountName: String(response.accountName || `${params.projectTitle} Funding`),
        bankCode: response.bankCode ? String(response.bankCode) : null,
        bankName: response.bankName ? String(response.bankName) : 'Interswitch',
        payableCode: response.payableCode
          ? String(response.payableCode)
          : this.required('INTERSWITCH_PAYABLE_CODE'),
        externalReference: response.requestReference
          ? String(response.requestReference)
          : `proj_${params.projectId}`,
        metadata: response,
      },
      'Virtual account created successfully'
    );
  }
  
  async createWebpayCheckout(params: {
    amountMinor: number;
    email: string;
    fundingId: string;
    projectSlug: string;
    projectId: string;
  }): Promise<ServiceResponse> {
    if (this.isMockMode()) {
      return createServiceResponse(
        {
          url: `${this.config.get('FRONTEND_URL')}/projects/${params.projectSlug}?funded=true`,
          transactionReference: `mock_tx_${randomUUID()}`,
        },
        'Mock checkout initiated'
      );
    }
    
    const response = await this.request<{paymentUrl: string, transactionReference: string}>(
      this.config.get<string>('INTERSWITCH_WEBPAY_URL') || 
      'https://sandbox.interswitchng.com/paymentgateway/api/v1/checkout',
      {
        method: 'POST',
        body: {
          amount: params.amountMinor,
          customerId: params.email,
          merchantCode: this.required('INTERSWITCH_MERCHANT_CODE'),
          payableCode: this.required('INTERSWITCH_PAYABLE_CODE'),
          transactionReference: `fund_${params.fundingId}`,
          redirectUrl: `${this.config.get('FRONTEND_URL')}/projects/${params.projectSlug}?funded=true`,
        }
      }
    );
    
    return createServiceResponse(
      {
        url: response.paymentUrl,
        transactionReference: response.transactionReference
      },
      'Webpay checkout initiated successfully'
    );
  }

  async createPayout(params: {
    amountMinor: number;
    accountNumber: string;
    accountName: string;
    bankCode: string;
    narration: string;
    reference: string;
  }): Promise<ServiceResponse> {
    if (this.isMockMode()) {
      return createServiceResponse(
        {
          providerReference: params.reference,
          providerPayoutId: `payout_${randomUUID()}`,
          status: 'PROCESSING',
          metadata: {
            responseCode: '00',
            transactionReference: params.reference,
          },
        },
        'Mock payout initiated'
      );
    }

    const response = await this.request<InterswitchPayoutResponse>(
      this.config.get<string>('INTERSWITCH_PAYOUT_URL') ||
        'https://sandbox.interswitchng.com/api/v1/payouts',
      {
        method: 'POST',
        body: {
          transactionReference: params.reference,
          amount: (params.amountMinor / 100).toFixed(2),
          currency: 'NGN',
          beneficiary: {
            accountNumber: params.accountNumber,
            accountName: params.accountName,
            bankCode: params.bankCode,
          },
          narration: params.narration,
          singleCall: true,
        },
      },
    );

    return createServiceResponse(
      {
        providerReference: response.transactionReference || params.reference,
        providerPayoutId: response.transactionId || response.transactionReference || params.reference,
        status: response.status || 'PROCESSING',
        metadata: response,
      },
      'Payout initiated successfully'
    );
  }

  private async request<T>(
    url: string,
    init: {
      method: 'POST' | 'GET';
      body?: Record<string, unknown>;
    },
  ): Promise<T> {
    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    Object.entries(this.authHeaders()).forEach(([key, value]) => {
      headers.set(key, value);
    });

    const response = await fetch(url, {
      method: init.method,
      headers,
      body: init.body ? JSON.stringify(init.body) : undefined,
    });

    const text = await response.text();
    let payload: unknown = null;

    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { raw: text };
      }
    }

    if (!response.ok) {
      throw new BadGatewayException({
        message: 'Interswitch request failed',
        statusCode: response.status,
        payload,
      });
    }

    return payload as T;
  }

  private authHeaders() {
    const bearerToken = this.config.get<string>('INTERSWITCH_BEARER_TOKEN');
    if (bearerToken) {
      return { Authorization: `Bearer ${bearerToken}` };
    }

    const clientId = this.config.get<string>('INTERSWITCH_CLIENT_ID');
    const clientSecret = this.config.get<string>('INTERSWITCH_CLIENT_SECRET');

    if (clientId && clientSecret) {
      return {
        'X-Client-Id': clientId,
        'X-Client-Secret': clientSecret,
      };
    }

    throw new InternalServerErrorException(
      'Interswitch credentials are not configured',
    );
  }

  private isMockMode() {
    return this.config.get<string>('INTERSWITCH_MOCK_MODE') === 'true';
  }

  private required(key: string) {
    const value = this.config.get<string>(key);
    if (!value) {
      throw new InternalServerErrorException(`${key} is not configured`);
    }

    return value;
  }

  private mockVirtualAccount(projectId: string, projectTitle: string) {
    const digits = projectId.replace(/[^0-9]/g, '').slice(0, 10).padEnd(10, '7');
    return {
      accountNumber: digits,
      accountName: `${projectTitle} Funding`.slice(0, 30),
      bankCode: '999',
      bankName: 'Interswitch Mock Bank',
      payableCode: this.config.get<string>('INTERSWITCH_PAYABLE_CODE') || 'MOCKPAY',
      externalReference: `proj_${projectId}`,
      metadata: { mock: true },
    };
  }
}
