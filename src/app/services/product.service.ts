import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap, catchError, of } from 'rxjs';
import { Product } from '../models/product.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:3000/products';

  constructor(private http: HttpClient) {}

  // GET: obtener todos los productos con IDs normalizados
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl).pipe(
      map(products => products.map(product => ({
        ...product,
        id: Number(product.id)
      })))
    );
  }

  // GET: obtener el próximo ID disponible
  private getNextId(): Observable<number> {
    return this.getProducts().pipe(
      map(products => {
        if (products.length === 0) return 1;
        const maxId = Math.max(...products.map(p => p.id));
        return maxId + 1;
      })
    );
  }

  // POST: agregar un producto con ID único numérico
  addProduct(productData: Omit<Product, 'id'>): Observable<Product> {
    return this.getNextId().pipe(
      switchMap(nextId => {
        const productWithId = {
          ...productData,
          id: nextId,
          price: Number(productData.price),
          stock: Number(productData.stock)
        };
        return this.http.post<Product>(this.apiUrl, productWithId);
      }),
      map(product => ({
        ...product,
        id: Number(product.id)
      }))
    );
  }

  // PUT: actualizar un producto existente
  updateProduct(id: number, product: Omit<Product, 'id'>): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, { ...product, id });
  }

  // DELETE: eliminar un producto por ID con manejo de errores
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        if (error.status === 404) {
          console.warn('Producto no encontrado en el servidor (puede haber sido eliminado)');
          return of(undefined as void);
        }
        throw error;
      })
    );
  }

  // GET: obtener un producto por ID
  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`).pipe(
      map(product => ({
        ...product,
        id: Number(product.id)
      }))
    );
  }
}
