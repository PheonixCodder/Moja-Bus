# Pagination
Pagination allows you to efficiently retrieve large sets of data from the Paystack API. Instead of returning all results at once, which, could slow and resource intensive, pagination breaks the sets of data into smaller chunks before sending them. This approach improves performance, reduces network load, and enhances the overall user experience when working with large datasets.

The Paystack API supports two types of pagination:

1.  Offset Pagination
2.  Cursor Pagination

Each type has its own use cases and implementation details.

Offset pagination allows you to request specific `page` and `perPage` values when fetching records. The `page` parameter specifies which page of records to retrieve, while the `perPage` parameter specifies how many records you want to retrieve per page.

To use offset pagination, include the `page` and `perPage` parameters as query parameters in your API request:

<table class="params-holder"><caption class="params-group">Query Parameters</caption><tbody><tr><td class="param-details"><p>page</p><p>Number</p></td><td>The page to retrieve</td></tr><tr><td class="param-details"><p>perPage</p><p>Number</p></td><td><span>This specifies the number of records to return per request. <strong>Default: 50</strong></span></td></tr></tbody></table>

The `meta` object in the JSON response from `GET /transaction` includes a `total_volume` parameter, which is the sum of all the transactions that have been fetched.

```
1#!/bin/sh2url="https://api.paystack.co/transaction?page=1&perPage=50"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

-   Offset Pagination Metadata

```
1{2  "meta": {3    "total": 7316,4    "total_volume": 397800,5    "skipped": 0,6    "perPage": 50,7    "page": 1,8    "pageCount": 1479  }10}
```

Cursor pagination uses a unique identifier called a cursor to keep track of where in the dataset to continue from. This method is more efficient for retrieving large datasets and provides more consistent results when items are being added or removed frequently.

To use cursor pagination, include the `use_cursor` query parameter and set it to `true` on your first fetch request. The `meta` object in the JSON response will contain a parameter called `next` that contains the cursor for the next set of records, and a `previous` parameter for the previous page. Include these as query parameters in subsequent requests to fetch the next or previous set of data.

<table class="params-holder"><caption class="params-group">Query Parameters</caption><tbody><tr><td class="param-details"><p>use_cursor</p><p>Boolean</p></td><td>Set this to <code>true</code> to retrieve results using cursor pagination</td></tr><tr><td class="param-details"><p>next</p><p>String</p></td><td>A cursor to use in pagination, <code>next</code> points to the next page of the dataset. Set this to the <code>next</code> cursor received in the meta object of a previous request.</td></tr><tr><td class="param-details"><p>previous</p><p>String</p></td><td>A cursor to use in pagination, <code>previous</code> previous page of the dataset. Set this to the <code>previous</code> cursor received in the meta object of a previous request.</td></tr><tr><td class="param-details"><p>perPage</p><p>Number</p></td><td><span>The number of records to return per request. <strong>Default: 50</strong></span></td></tr></tbody></table>

Cursor-based pagination is currently only available on the following endpoints:

-   Transactions
-   Customers
-   Dedicated Accounts
-   Transfer Recipient
-   Transfers
-   Disputes

```
1#!/bin/sh2url="https://api.paystack.co/transaction?use_cursor=true&perPage=50"3authorization="Authorization: Bearer YOUR_SECRET_KEY"4
5curl "$url" -H "$authorization" -X GET
```

-   Cursor Pagination Metadata

```
1{2  "meta": {3    "next": "dW5kZWZpbmVkOjQwOTczNTgxNTg=",4    "previous": "null",5    "perPage": 496  }7}
```

## Best Practices

1.  **Choose the Right Pagination Type**: Use offset-based pagination for smaller, static datasets. For larger or frequently updated datasets, prefer cursor-based pagination.
2.  **Set Reasonable Page Sizes**: Start with the default of 50 items per page. Adjust based on your specific needs, but avoid requesting too many items at once more than 1000 items at once to prevent performance issues.
3.  **Handle Edge Cases**: Always check if there are more pages available. For offset-based pagination, it’s best to fetch pages until no results are returned. For cursor-based pagination, the absence of a `next` cursor indicates you've reached the end.
4.  **Implement Error Handling**: Be prepared to handle pagination-related errors, such as invalid page numbers or cursors.
5.  **Consider Rate Limits**: Be mindful of Paystack's rate limits when implementing pagination, especially if you're fetching large amounts of data. Implement appropriate delays between requests if necessary.
6.  **Cache Wisely**: If you're caching paginated results, ensure your cache invalidation strategy accounts for potential changes in the dataset.

By following these best practices, you'll be able to efficiently work with large datasets in the Paystack API while providing a smooth experience for your users.