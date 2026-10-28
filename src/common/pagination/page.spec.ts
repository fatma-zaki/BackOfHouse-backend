import { adminPage, appPage, pageWindow } from './page';

describe('page helpers (D4)', () => {
  it('turns a 1-based page into skip/take', () => {
    expect(pageWindow({ page: 1, page_size: 20 })).toEqual({ skip: 0, take: 20 });
    expect(pageWindow({ page: 3, page_size: 20 })).toEqual({ skip: 40, take: 20 });
  });

  it('app page: an extra row means has_more and is dropped', () => {
    const page = appPage([1, 2, 3], { page: 1, page_size: 2 });
    expect(page.items).toEqual([1, 2]);
    expect(page.meta).toEqual({ page: 1, page_size: 2, has_more: true });
    expect(appPage([1, 2], { page: 2, page_size: 2 }, 4).meta).toEqual({
      page: 2,
      page_size: 2,
      has_more: false,
      total: 4,
    });
  });

  it('admin page: total and total_pages, at least one page', () => {
    expect(adminPage([1], { page: 1, page_size: 20 }, 41).meta).toEqual({
      page: 1,
      page_size: 20,
      total: 41,
      total_pages: 3,
    });
    expect(adminPage([], { page: 1, page_size: 20 }, 0).meta.total_pages).toBe(1);
  });
});
