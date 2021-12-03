import 'dart:async';
import 'dart:math';

import 'package:cash_manager/components/animated_expander.dart';
import 'package:cash_manager/components/product_tile.dart';
import 'package:cash_manager/models/product.dart';
import 'package:cash_manager/components/barcode_scanner.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_code_scanner/qr_code_scanner.dart';

class ShoppingCart extends StatefulWidget {
  ShoppingCart({Key? key}) : super(key: key);

  @override
  _ShoppingCartState createState() => _ShoppingCartState();
}

class _ShoppingCartState extends State<ShoppingCart>
    with TickerProviderStateMixin {
  bool showQRScanner = false;
  List<Product> products = [];
  final animatedListKey = GlobalKey<AnimatedListState>();
  late StreamController<bool> _expandController;

  @override
  void initState() {
    super.initState();
    _expandController = StreamController.broadcast();
  }

  @override
  dispose() {
    _expandController.close();
    super.dispose();
  }

  onScan(Barcode code) {
    if (code.format == BarcodeFormat.ean13) {
      HapticFeedback.vibrate();
      setState(() {
        products = products..insert(0, Product());
        animatedListKey.currentState
            ?.insertItem(0, duration: Duration(milliseconds: 1000));
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Shopping Cart'),
      ),
      body: Center(
          child: Column(
        children: [
          AnimatedExpander(
              onCollapsed: () {
                setState(() {
                  showQRScanner = false;
                });
              },
              onExpanded: () {
                setState(() {
                  showQRScanner = true;
                });
              },
              child: BarCodeScanner(
                onScan: onScan,
                scanDelay: const Duration(milliseconds: 1000),
              ),
              expansionChild: Container(
                color: Colors.black,
              ),
              duration: const Duration(milliseconds: 250),
              listenable: _expandController.stream,
              defaultExpanded: false,
              width: MediaQuery.of(context).size.width,
              height: MediaQuery.of(context).size.height / 2),
          Expanded(
            child: AnimatedList(
              key: animatedListKey,
              initialItemCount: 0,
              itemBuilder: (context, index, animation) {
                var anim = animation.drive(Tween(begin: 1.0, end: 0.0));
                return AnimatedBuilder(
                  animation: anim,
                  child: ProductTile(product: products[index]),
                  builder: (context, child) {
                    return Container(
                      child: child,
                      color: Colors.red.withOpacity(anim.value),
                    );
                  },
                );
              },
            ),
          ),
        ],
      )),
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.all(8.0),
        child: ElevatedButton(onPressed: () {}, child: Text('Pay')),
      ),
      floatingActionButton: FloatingActionButton(
          onPressed: () {
            _expandController.add(!showQRScanner);
          },
          tooltip: 'QR Code',
          child:
              showQRScanner ? Icon(Icons.close) : Icon(Icons.qr_code_scanner)),
    );
  }
}
