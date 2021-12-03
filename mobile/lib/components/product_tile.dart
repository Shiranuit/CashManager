import 'package:cash_manager/models/product.dart';
import 'package:flutter/material.dart';

class ProductTile extends StatefulWidget {
  final Product product;
  const ProductTile({Key? key, required this.product}) : super(key: key);

  @override
  _ProductTileState createState() => _ProductTileState();
}

class _ProductTileState extends State<ProductTile> {
  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(widget.product.name ?? 'Unkown name'),
    );
  }
}
