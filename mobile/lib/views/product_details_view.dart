import 'package:cash_manager/models/product.dart';
import 'package:flutter/material.dart';

class ProductDetailsView extends StatefulWidget {
  final Product product;
  ProductDetailsView({
    Key? key,
    required this.product,
  }) : super(key: key);

  @override
  _ProductDetailsViewState createState() => _ProductDetailsViewState();
}

class _ProductDetailsViewState extends State<ProductDetailsView> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.product.name ?? 'Unknown Product name'),
      ),
      body: Container(),
    );
  }
}
