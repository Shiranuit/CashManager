import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:cash_manager/views/payment_view.dart';
import 'package:cash_manager/views/product_details_view.dart';

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
  double totalPrice = 0;
  int totalQuantity = 0;
  late Animation<Color?> _animatedColor;
  late AnimationController _animatedColorController;

  @override
  void initState() {
    super.initState();
    _expandController = StreamController.broadcast();
    _animatedColorController = AnimationController(
      animationBehavior: AnimationBehavior.preserve,
      vsync: this,
      duration: const Duration(seconds: 1),
    )..repeat(reverse: true);
  }

  @override
  void didChangeDependencies() {
    _animatedColor = ColorTween(
            begin: Theme.of(context).buttonTheme.colorScheme?.primary,
            end: const Color.fromARGB(255, 143, 252, 246))
        .animate(_animatedColorController);
    super.didChangeDependencies();
  }

  @override
  dispose() {
    _expandController.close();
    _animatedColorController.dispose();
    super.dispose();
  }

  void updatePaiementInfo() {
    double price = 0;
    int quantity = 0;
    for (var product in products) {
      price += product.price * product.quantity;
      quantity = product.quantity;
    }
    setState(() {
      totalPrice = price;
      totalQuantity = quantity;
    });
  }

  Future<Product?> getProduct(String code) async {
    var prefs = await SharedPreferences.getInstance();
    String? ip = prefs.getString('ip');
    String? jwt = prefs.getString('jwt');

    if (ip != null && jwt != null) {
      try {
        var response = await http.get(
          Uri.parse('http://$ip/api/product/$code'),
          headers: {
            'Authorization': jwt,
          },
        );
        if (response.statusCode == 200) {
          var utf8Body = utf8.decode(response.bodyBytes);
          var json = jsonDecode(utf8Body);
          return Product.fromJson(
            json["result"],
          )..addListener(updatePaiementInfo);
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

          animatedListKey.currentState?.insertItem(
            0,
            duration: const Duration(milliseconds: 1000),
          );
        });
        updatePaiementInfo();
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
            )..addListener(updatePaiementInfo),
          );
        animatedListKey.currentState?.insertItem(
          0,
          duration: const Duration(milliseconds: 1000),
        );
      });
      updatePaiementInfo();
      return false;
    }

    setState(() {
      products = products..insert(0, product);
      animatedListKey.currentState?.insertItem(
        0,
        duration: const Duration(milliseconds: 1000),
      );
    });
    updatePaiementInfo();
    return true;
  }

  Future<bool> onScan(Barcode code) async {
    if (code.format == BarcodeFormat.ean13 ||
        code.format == BarcodeFormat.ean8 ||
        code.format == BarcodeFormat.codabar) {
      if (code.code != null) {
        return await addProduct(code.code!);
      }
    }
    return false;
  }

  void onDeleteProduct(Product product) {
    setState(() {
      int index = products.indexOf(product);
      products = products..removeAt(index);
      animatedListKey.currentState?.removeItem(
        index,
        (context, animation) {
          return Container();
        },
      );
    });
    updatePaiementInfo();

    SnackBar undoBar = SnackBar(
      backgroundColor: Colors.grey[700],
      content: Text(
        'Deleted "${product.name}"',
        style: const TextStyle(color: Colors.white),
      ),
      action: SnackBarAction(
        label: 'Undo',
        textColor: Colors.red,
        onPressed: () {
          setState(() {
            products = products..insert(0, product);

            animatedListKey.currentState?.insertItem(
              0,
              duration: const Duration(milliseconds: 1000),
            );
          });
          updatePaiementInfo();
        },
      ),
    );

    ScaffoldMessenger.of(context).showSnackBar(undoBar);
  }

  void _clearAllItems() {
    for (var i = 0; i <= products.length - 1; i++) {
      animatedListKey.currentState?.removeItem(0,
          (BuildContext context, Animation<double> animation) {
        return Container();
      });
    }
    products.clear();
  }

  void showProductDetails(Product product) {
    // Navigator.push(
    //   context,
    //   MaterialPageRoute(
    //     builder: (context) => ProductDetailsView(product: product),
    //   ),
    // );
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
          // Barcode Scanner
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
                  child: const Text(
                    'Scan product',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                    softWrap: true,
                  ),
                  builder: (context, state, child) {
                    if (state == ScanState.beforeFirstScan) {
                      return child;
                    }
                  },
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
            height: MediaQuery.of(context).size.height / 2.5,
          ),
          // Shopping Cart
          Expanded(
            child: AnimatedList(
              key: animatedListKey,
              initialItemCount: 0,
              itemBuilder: (context, index, animation) {
                var anim = animation.drive(Tween(begin: 1.0, end: 0.0));
                return AnimatedBuilder(
                  animation: anim,
                  child: ProductTile(
                    product: products[index],
                    onDelete: onDeleteProduct,
                    onTap: showProductDetails,
                  ),
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
      // Bottom ar with total price and product count
      bottomNavigationBar: Padding(
          padding: const EdgeInsets.all(8.0),
          child: Card(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            elevation: 8,
            child: Container(
                decoration: const BoxDecoration(
                  borderRadius: BorderRadius.all(
                    Radius.circular(16),
                  ),
                ),
                height: 80,
                child: Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Column(
                        children: [
                          Text(
                            'Products',
                            style: Theme.of(context).textTheme.headline6,
                          ),
                          Text(
                            totalQuantity.toString(),
                            style: Theme.of(context).textTheme.headline6,
                          ),
                        ],
                      ),
                      Column(
                        children: [
                          Text(
                            'Total',
                            style: Theme.of(context).textTheme.headline6,
                          ),
                          Text(
                            '${totalPrice.toStringAsFixed(2)}€',
                            style: Theme.of(context).textTheme.headline6,
                          ),
                        ],
                      ),
                      Tooltip(
                        message: 'Pay',
                        child: ElevatedButton(
                          onPressed: () async {
                            bool? success = await Navigator.push<bool>(
                              context,
                              MaterialPageRoute(
                                builder: (context) => PaymentView(
                                  products: products,
                                ),
                              ),
                            );
                            if (success != null && success == true) {
                              setState(() {
                                totalPrice = 0;
                                totalQuantity = 0;
                                _clearAllItems();
                              });
                            }
                          },
                          child: Row(
                            children: const [
                              Icon(Icons.payment),
                              Text('Pay'),
                            ],
                          ),
                        ),
                      )
                    ],
                  ),
                )),
          )),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      floatingActionButton: AnimatedBuilder(
        animation: _animatedColor,
        builder: (BuildContext context, Widget? child) {
          return FloatingActionButton(
            onPressed: () {
              if (!showQRScanner) {
                _animatedColorController.stop();
                _animatedColorController.reset();
              } else {
                _animatedColorController.repeat(reverse: true);
              }
              _expandController.add(!showQRScanner);
            },
            backgroundColor: _animatedColor.value,
            tooltip: 'Scan Barcode',
            child: showQRScanner
                ? const Icon(Icons.close)
                : const Icon(Icons.qr_code_scanner),
          );
        },
      ),
    );
  }
}
