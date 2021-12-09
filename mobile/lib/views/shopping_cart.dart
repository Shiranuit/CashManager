import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;

import 'package:cash_manager/components/animated_expander.dart';
import 'package:cash_manager/components/product_tile.dart';
import 'package:cash_manager/models/product.dart';
import 'package:cash_manager/components/barcode_scanner.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_code_scanner/qr_code_scanner.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ShoppingCart extends StatefulWidget {
  const ShoppingCart({Key? key}) : super(key: key);

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

  Future<Product?> getProduct(String code) async {
    var prefs = await SharedPreferences.getInstance();
    String? ip = prefs.getString('ip');

    if (ip != null) {
      try {
        var response =
            await http.get(Uri.parse('http://$ip/api/product/$code'));
        if (response.statusCode == 200) {
          var utf8Body = utf8.decode(response.bodyBytes);
          var json = jsonDecode(utf8Body);
          return Product.fromJson(json["result"]);
        }
      } catch (_) {
        return null;
      }
    }

    return null;
  }

  Future<bool> addProduct(String code) async {
    for (var i = 0; i < products.length; i++) {
      if (products[i].code == code) {
        if (products[i].quantity < 99) {
          products[i].quantity++;
        }

        bool invalid = products[i].invalid;
        setState(() {
          products = products..insert(0, products.removeAt(i));
          animatedListKey.currentState?.removeItem(i, (context, animation) {
            return Container();
          });

          animatedListKey.currentState
              ?.insertItem(0, duration: const Duration(milliseconds: 1000));
        });
        return !invalid;
      }
    }

    var product = await getProduct(code);
    if (product == null) {
      setState(() {
        products = products
          ..insert(
              0,
              Product(
                name: 'Unkown product <$code>',
                code: code,
                invalid: true,
              ));
        animatedListKey.currentState
            ?.insertItem(0, duration: const Duration(milliseconds: 1000));
      });
      return false;
    }

    setState(() {
      products = products..insert(0, product);
      animatedListKey.currentState
          ?.insertItem(0, duration: const Duration(milliseconds: 1000));
    });
    return true;
  }

  Future<bool> onScan(Barcode code) async {
    if (code.format == BarcodeFormat.ean13 ||
        code.format == BarcodeFormat.ean8 ||
        code.format == BarcodeFormat.codabar) {
      if (code.code != null) {
        HapticFeedback.vibrate();
        return await addProduct(code.code!);
      }
    }
    return false;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Shopping Cart'),
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
              child: Padding(
                padding: const EdgeInsets.all(8.0),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: BarCodeScanner(
                    onScan: onScan,
                    scanDelay: const Duration(milliseconds: 1000),
                  ),
                ),
              ),
              expansionChild: Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                color: Colors.black,
              ),
              duration: const Duration(milliseconds: 250),
              listenable: _expandController.stream,
              defaultExpanded: false,
              width: MediaQuery.of(context).size.width,
              height: MediaQuery.of(context).size.height / 2.5),
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
        child: ElevatedButton(
          onPressed: () {},
          child: Text('Pay'),
        ),
      ),
      floatingActionButton: FloatingActionButton(
          onPressed: () {
            _expandController.add(!showQRScanner);
          },
          tooltip: 'QR Code',
          child: showQRScanner
              ? const Icon(Icons.close)
              : const Icon(Icons.qr_code_scanner)),
    );
  }
}
