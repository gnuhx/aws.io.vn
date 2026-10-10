import '@testing-library/jest-dom/vitest'; // thêm toBeInTheDocument, toBeDisabled, …
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();             // gỡ component của test trước
  localStorage.clear();  // mỗi test bắt đầu với localStorage sạch
});
