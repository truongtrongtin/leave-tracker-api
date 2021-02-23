import {
  IPaginationLinks,
  IPaginationMeta,
  IPaginationOptions,
} from './pagination.interfaces';

export class Pagination<Entity> {
  public readonly items: Entity[];
  public readonly meta: IPaginationMeta;
  public readonly links?: IPaginationLinks;

  constructor(paginationOptions: IPaginationOptions<Entity>) {
    const { items, totalItems, limit, currentPage, route } = paginationOptions;
    const totalPages = Math.ceil(totalItems / limit);
    const hasPreviousPage = currentPage > 1;
    const hasNextPage = currentPage < totalPages;
    const hasLastPage = totalPages > 0;

    this.items = items;

    this.meta = {
      currentPage,
      itemCount: items.length,
      itemsPerPage: limit,
      totalItems: totalItems,
      totalPages: totalPages,
    };

    if (route) {
      this.links = {
        first: `${route}?limit=${limit}`,
        previous: hasPreviousPage
          ? `${route}?page=${currentPage - 1}&limit=${limit}`
          : '',
        next: hasNextPage
          ? `${route}?page=${currentPage + 1}&limit=${limit}`
          : '',
        last: hasLastPage ? `${route}?page=${totalPages}&limit=${limit}` : '',
      };
    }
  }
}
