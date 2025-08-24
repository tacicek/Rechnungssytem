import { useState, useEffect } from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Upload, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { productStorage } from "@/lib/storage-simple";
import { Product } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [newCategory, setNewCategory] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    taxRate: 8.1,
    imageUrl: "",
    category: "",
    isActive: true
  });
  const { toast } = useToast();

  // Image handling functions
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fehler",
          description: "Bild ist zu groß. Maximale Größe: 5MB",
          variant: "destructive"
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Fehler",
          description: "Bitte wählen Sie eine gültige Bilddatei aus.",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setFormData({ ...formData, imageUrl: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, imageUrl: "" });
  };

  // Category management functions
  const loadCategories = () => {
    const savedCategories = localStorage.getItem('productCategories');
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    } else {
      // Default categories if none exist
      const defaultCategories = ['Produkte', 'Dienstleistungen', 'Sonstiges'];
      setCategories(defaultCategories);
      localStorage.setItem('productCategories', JSON.stringify(defaultCategories));
    }
  };

  const addCategory = () => {
    if (!newCategory.trim()) {
      toast({
        title: "Fehler",
        description: "Kategoriename darf nicht leer sein.",
        variant: "destructive"
      });
      return;
    }

    if (categories.includes(newCategory.trim())) {
      toast({
        title: "Fehler",
        description: "Diese Kategorie existiert bereits.",
        variant: "destructive"
      });
      return;
    }

    const updatedCategories = [...categories, newCategory.trim()];
    setCategories(updatedCategories);
    localStorage.setItem('productCategories', JSON.stringify(updatedCategories));
    setNewCategory("");
    setIsAddingCategory(false);
    
    toast({
      title: "Kategorie hinzugefügt",
      description: `"${newCategory.trim()}" wurde erfolgreich hinzugefügt.`
    });
  };

  const deleteCategory = (categoryToDelete: string) => {
    if (categories.length <= 1) {
      toast({
        title: "Fehler",
        description: "Mindestens eine Kategorie muss vorhanden sein.",
        variant: "destructive"
      });
      return;
    }

    const updatedCategories = categories.filter(cat => cat !== categoryToDelete);
    setCategories(updatedCategories);
    localStorage.setItem('productCategories', JSON.stringify(updatedCategories));
    
    toast({
      title: "Kategorie gelöscht",
      description: `"${categoryToDelete}" wurde gelöscht.`
    });
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    const allProducts = await productStorage.getAll();
    setProducts(allProducts);
    filterProducts(allProducts, selectedCategory);
  };

  const filterProducts = (productList: Product[], categoryFilter: string) => {
    if (!categoryFilter || categoryFilter === "") {
      setFilteredProducts(productList);
    } else {
      const filtered = productList.filter(product => product.category === categoryFilter);
      setFilteredProducts(filtered);
    }
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
    filterProducts(products, category);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      taxRate: 8.1,
      imageUrl: "",
      category: "",
      isActive: true
    });
    setEditingProduct(null);
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        taxRate: product.taxRate,
        imageUrl: product.imageUrl || "",
        category: product.category || "",
        isActive: product.isActive !== false
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    // Comprehensive validation
    if (!formData.name || !formData.name.trim()) {
      toast({
        title: "Fehler",
        description: "Produktname ist erforderlich.",
        variant: "destructive"
      });
      return;
    }

    if (typeof formData.price !== 'number' || formData.price <= 0) {
      toast({
        title: "Fehler",
        description: "Preis muss eine gültige Zahl größer als 0 sein.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.category || !formData.category.trim()) {
      toast({
        title: "Fehler",
        description: "Produktkategorie ist erforderlich.",
        variant: "destructive"
      });
      return;
    }

    if (typeof formData.taxRate !== 'number' || formData.taxRate < 0 || formData.taxRate > 100) {
      toast({
        title: "Fehler",
        description: "MwSt. Satz muss zwischen 0 und 100% liegen.",
        variant: "destructive"
      });
      return;
    }

    // Test localStorage availability
    try {
      const testKey = 'test-storage-' + Date.now();
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
    } catch (storageError) {
      toast({
        title: "Speicher-Fehler",
        description: "Browser-Speicher ist nicht verfügbar. Bitte prüfen Sie Ihre Browser-Einstellungen.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingProduct) {
        const updatedProduct: Product = {
          ...editingProduct,
          ...formData
        };
        await productStorage.update(editingProduct.id, updatedProduct);
        toast({
          title: "Produkt aktualisiert",
          description: "Das Produkt wurde erfolgreich aktualisiert.",
        });
      } else {
        console.log('Creating new product with data:', formData);
        const newProduct = await productStorage.add(formData);
        console.log('Product created successfully:', newProduct);
        toast({
          title: "Produkt erstellt",
          description: "Das Produkt wurde erfolgreich erstellt.",
        });
      }
      
      await loadProducts();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Beim Speichern des Produkts ist ein Fehler aufgetreten.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (productId: string, productName: string) => {
    try {
      await productStorage.delete(productId);
      await loadProducts();
      toast({
        title: "Produkt gelöscht",
        description: `${productName} wurde erfolgreich gelöscht.`,
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Beim Löschen des Produkts ist ein Fehler aufgetreten.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold">Produkte</h1>
          <p className="text-sm text-muted-foreground">Verwalten Sie Ihre Produkte und Dienstleistungen</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Neues Produkt
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Produkt bearbeiten" : "Neues Produkt"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Produktname *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. Beratungsstunde"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Produktbeschreibung... (optional)"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Preis (CHF) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="taxRate">MwSt. Satz (%) *</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>
              
              {/* Category Selection with Management */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="category">Kategorie *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingCategory(!isAddingCategory)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Neue Kategorie
                  </Button>
                </div>
                
                {isAddingCategory && (
                  <div className="mb-3 p-3 border rounded-lg bg-gray-50">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Kategoriename eingeben"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                      />
                      <Button type="button" size="sm" onClick={addCategory}>
                        Hinzufügen
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setIsAddingCategory(false);
                          setNewCategory("");
                        }}
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                )}
                
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kategorie auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        <div className="flex items-center justify-between w-full">
                          <span>{category}</span>
                          {categories.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 ml-2 text-red-500 hover:text-red-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteCategory(category);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Produktbild</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  {formData.imageUrl ? (
                    <div className="space-y-2">
                      <img 
                        src={formData.imageUrl} 
                        alt="Product preview" 
                        className="w-full h-32 object-cover rounded-md"
                      />
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={removeImage}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Bild entfernen
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-2">
                        <label htmlFor="image-upload" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            Bild hochladen
                          </span>
                          <span className="mt-1 block text-xs text-gray-500">
                            PNG, JPG, GIF bis zu 5MB
                          </span>
                        </label>
                        <input
                          id="image-upload"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => document.getElementById('image-upload')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Bild auswählen
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked === true })}
                />
                <Label htmlFor="isActive">Produkt ist aktiv (verfügbar)</Label>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleSave}>
                  {editingProduct ? "Aktualisieren" : "Erstellen"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Filter Section */}
      {products.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Kategorie Filter
              <Badge variant="secondary">
                {filteredProducts.length} von {products.length} Produkten
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === "" ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryFilter("")}
              >
                Alle Kategorien ({products.length})
              </Button>
              {categories.map((category) => {
                const categoryCount = products.filter(p => p.category === category).length;
                return (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCategoryFilter(category)}
                  >
                    {category} ({categoryCount})
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredProducts.length === 0 && products.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">Noch keine Produkte vorhanden</p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Erstes Produkt erstellen
            </Button>
          </CardContent>
        </Card>
      ) : filteredProducts.length === 0 && products.length > 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Keine Produkte in der Kategorie "{selectedCategory}" gefunden
            </p>
            <Button 
              variant="outline"
              onClick={() => handleCategoryFilter("")}
            >
              Alle Produkte anzeigen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedCategory ? (
                <>Produkte: {selectedCategory} ({filteredProducts.length})</>
              ) : (
                <>Alle Produkte ({filteredProducts.length})</>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Bild</TableHead>
                  <TableHead>Produktname</TableHead>
                  <TableHead>Kategorie</TableHead>
                  <TableHead>Beschreibung</TableHead>
                  <TableHead className="text-right">Preis (CHF)</TableHead>
                  <TableHead className="text-right">MwSt. %</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center w-24">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className={product.isActive === false ? 'opacity-60' : ''}>
                    <TableCell>
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded border"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded border flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      {product.category && (
                        <Badge variant="secondary" className="text-xs">
                          {product.category}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate text-sm text-gray-600">
                        {product.description || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {product.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.taxRate}%
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={product.isActive !== false ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {product.isActive !== false ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(product)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Produkt löschen?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Möchten Sie "{product.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(product.id, product.name)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Löschen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
