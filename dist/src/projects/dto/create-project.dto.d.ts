export declare class CreateProjectDto {
    title: string;
    description: string;
    shortDescription?: string;
    imageUrl?: string;
    category?: string;
    goalAmount: number;
    endDate?: string;
    rewards?: {
        title: string;
        amount: number;
        description: string;
    }[];
}
