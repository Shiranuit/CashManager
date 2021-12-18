import 'package:flutter/foundation.dart';

class Product extends ChangeNotifier {
  String? name;
  String? image;
  String? ingredients;
  double price;
  int quantity;
  String? code;
  String? brand;
  String? nutriScore;
  Map<dynamic, dynamic>? raw;
  bool invalid;

  Product({
    this.name,
    this.image,
    this.price = 0.0,
    this.quantity = 1,
    this.code,
    this.brand,
    this.nutriScore,
    this.ingredients,
    this.raw,
    this.invalid = false,
  });

  factory Product.fromJson(Map<String, dynamic> json) => Product(
        name: json["name"],
        image: json["image"],
        price: double.tryParse(json["price"]) ?? 0.0,
        code: json["code"],
        brand: json["brand"],
        nutriScore: json["nutriScore"]?.toString().toUpperCase(),
        ingredients: json["ingredients"],
        raw: json["raw"],
      );

  notify() {
    notifyListeners();
  }
}
