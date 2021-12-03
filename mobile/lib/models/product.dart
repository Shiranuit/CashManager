class Product {
  String? name;
  String? image;
  String? ingredients;
  double? price;
  int quantity;
  String? code;
  String? brand;
  String? nutriScore;

  Product({
    this.name,
    this.image,
    this.price,
    this.quantity = 1,
    this.code,
    this.brand,
    this.nutriScore,
    this.ingredients,
  });

  factory Product.fromJson(Map<String, dynamic> json) => Product(
        name: json["product"]["product_name"],
        image: json["product"]["image_url"],
        price: json["product"]["price"].toDouble(),
        code: json["code"],
        brand: json["product"]["brand"],
        nutriScore:
            json["product"]["nutriscore_grade"]?.toString().toUpperCase(),
        ingredients: json["product"]["image_ingredients_url"],
      );
}
