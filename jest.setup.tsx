import React from 'react';
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream } from 'node:stream/web';

// Polyfill TextEncoder/TextDecoder for jsdom with type casting to satisfy IDE
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;
(global as any).ReadableStream = ReadableStream;

// Mock next-intl to avoid ESM transformation issues
jest.mock('next-intl', () => ({
    useTranslations: () => (key: any) => key,
    useLocale: () => 'id',
    useFormatter: () => ({}),
    useNow: () => new Date(),
    useTimeZone: () => 'Asia/Jakarta',
    NextIntlClientProvider: ({ children }: any) => <>{children}</>,
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
        prefetch: jest.fn(),
    }),
    useSearchParams: () => ({
        get: jest.fn(),
    }),
    useParams: () => ({}),
    usePathname: () => '',
}));

// Mock Chakra UI's useToast and other components that might cause issues in jsdom
jest.mock('@chakra-ui/react', () => {
    const original = jest.requireActual('@chakra-ui/react');
    return {
        ...original,
        useToast: () => jest.fn(),
        // Mocking Portal to avoid DOM issues in tests
        Portal: ({ children }: any) => <>{children}</>,
    };
});
