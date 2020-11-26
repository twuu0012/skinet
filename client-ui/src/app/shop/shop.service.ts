import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { IPagination, Pagination } from '../shared/models/pagination';
import { IBrand } from '../shared/models/brand';
import { IType } from '../shared/models/productType';
import { map } from 'rxjs/operators';
import { ShopParams } from '../shared/models/shopParams';
import { IProduct } from '../shared/models/product';
import { ObjectUnsubscribedError, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { debug } from 'console';

@Injectable({
  providedIn: 'root',
})
export class ShopService {
  baseUrl = environment.apiUrl;
  products: IProduct[] = [];
  brands: IBrand[] = [];
  types: IType[] = [];
  pagination = new Pagination();
  shopParams = new ShopParams();
  productCache = new Map();

  constructor(private http: HttpClient) {}

  getProducts(useCache: boolean) {
    if (useCache === false) {
      this.productCache = new Map();
    }
    if (this.productCache.size > 0 && useCache === true) {
      // join shopParams as key and store the product as value
      if (this.productCache.has(Object.values(this.shopParams).join('-'))) {
        this.pagination.data = this.productCache.get(Object.values(this.shopParams).join('-'));
        return of(this.pagination);
      }
      // const pageReceived = Math.ceil(this.products.length / this.shopParams.pageSize);
      // if (this.shopParams.pageIndex <= pageReceived) {
      //   this.pagination.data =
      //     this.products.slice((this.shopParams.pageIndex - 1) * this.shopParams.pageSize,
      //       this.shopParams.pageIndex * this.shopParams.pageSize);

      //   return of(this.pagination);
      // }
    }

    let params = new HttpParams();
    // if brand id exists
    // append to Http Params
    if (this.shopParams.brandId !== 0) {
      params = params.append('brandId', this.shopParams.brandId.toString());
    }

    if (this.shopParams.typeId !== 0) {
      params = params.append('typeId', this.shopParams.typeId.toString());
    }

    if (this.shopParams.search) {
      params = params.append('search', this.shopParams.search);
    }

    params = params.append('sort', this.shopParams.sort);
    params = params.append('pageIndex', this.shopParams.pageIndex.toString());
    params = params.append('pageSize', this.shopParams.pageSize.toString());

    return (
      this.http
        .get<IPagination>(this.baseUrl + 'products', {
          observe: 'response',
          params,
        })
        // use pipe to manipulate the observable and build the actual response
        .pipe(
          // map the body of http response
          map((response) => {
            // console.log(response);
            // this.products = [...this.products, ...response.body.data];
            // set product cache to map (key, value)
            this.productCache.set(Object.values(this.shopParams).join('-'), response.body.data);
            this.pagination = response.body;
            return response.body;
          })
        )
    );
  }

  setShopParams(params: ShopParams) {
    this.shopParams = params;
  }

  getShopParams() {
    return this.shopParams;
  }

  getProduct(id: number) {
    const product = this.products.find(p => p.id === id);
    if (product) {
      return of(product);
    }

    return this.http.get<IProduct>(this.baseUrl + 'products/' + id);
  }

  getBrands() {
    if (this.brands.length > 0) {
      return of(this.brands);
    }
    return this.http.get<IBrand[]>(this.baseUrl + 'products/brands').pipe(
      map(response => {
        this.brands = response;
        return response;
      })
    );
  }
  getTypes() {

    if (this.types.length > 0) {
      return of(this.types);
    }

    return this.http.get<IType[]>(this.baseUrl + 'products/types').pipe(
      map(response => {
        this.types = response;
        return response;
      })
    );
  }
}
