import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.interface';

@Component({
  selector: 'app-product-dashboard',
  templateUrl: './product-dashboard.component.html',
  styleUrls: ['./product-dashboard.component.scss']
})
export class ProductDashboardComponent implements OnInit {
  products: Product[] = [];
  productForm: FormGroup;
  private modalRef!: NgbModalRef;
  isLoading = false;

  constructor(
    private productService: ProductService,
    private fb: FormBuilder,
    private modalService: NgbModal
  ) {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      stock: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (products) => {
        // Ordenar productos por ID para mantener consistencia
        this.products = products
          .sort((a, b) => a.id - b.id);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar los productos', err);
        this.isLoading = false;
      }
    });
  }

  openModal(content: any): void {
    this.productForm.reset({
      name: '',
      price: 0,
      stock: 0
    });
    this.modalRef = this.modalService.open(content, { centered: true });
  }

  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  addProduct(): void {
    if (this.productForm.valid && !this.isLoading) {
      this.isLoading = true;

      const productData = {
        name: this.productForm.value.name.trim(),
        price: Number(this.productForm.value.price),
        stock: Number(this.productForm.value.stock)
      };

      this.productService.addProduct(productData).subscribe({
        next: (product) => {
          // Insertar el producto en la posición correcta manteniendo el orden por ID
          const insertIndex = this.products.findIndex(p => p.id > product.id);
          if (insertIndex === -1) {
            this.products.push(product);
          } else {
            this.products.splice(insertIndex, 0, product);
          }

          this.closeModal();
          this.isLoading = false;
          console.log('Producto agregado correctamente');
        },
        error: (err) => {
          console.error('Error al agregar el producto', err);
          this.isLoading = false;
        }
      });
    }
  }

  deleteProduct(id: number): void {
    // Verificar si el producto existe en la lista local
    const productExists = this.products.find(p => p.id === id);
    if (!productExists) {
      console.warn('Producto no encontrado en la lista local');
      return;
    }

    if (confirm('¿Estás seguro de querer eliminar este producto?')) {
      const productIndex = this.products.findIndex(p => p.id === id);
      if (productIndex === -1) return;
      this.isLoading = true;

      this.productService.deleteProduct(id).subscribe({
        next: () => {
          // Eliminar de la lista local
          this.products = this.products.filter(p => p.id !== id);
          this.isLoading = false;
          console.log('Producto eliminado correctamente');
        },
        error: (err) => {
          this.isLoading = false;

          if (err.status === 404) {
            console.warn('Producto ya eliminado del servidor, eliminando de la lista local');
            this.products = this.products.filter(p => p.id !== id);
          } else {
            console.error('Error al eliminar el producto', err);
            alert(`Error al eliminar el producto: ${err.message || 'Error desconocido'}`);
          }
        }
      });
    }
  }

  getErrorMessage(field: string): string {
    const control = this.productForm.get(field);
    if (!control) return '';

    if (control.hasError('required')) {
      return 'El campo es requerido';
    }

    if (field === 'name' && control.hasError('minlength')) {
      return 'El nombre debe tener al menos 2 caracteres';
    }

    if (field === 'price' && control.hasError('min')) {
      return 'El precio debe ser mayor a 0';
    }

    if (field === 'stock' && control.hasError('min')) {
      return 'La cantidad debe ser 0 o mayor';
    }

    return '';
  }

  // TrackBy function para mejorar performance en *ngFor
  trackByProductId(index: number, product: Product): number {
    return product.id;
  }
}
