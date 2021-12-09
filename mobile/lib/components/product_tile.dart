import 'package:cached_network_image/cached_network_image.dart';
import 'package:cash_manager/components/change_notifier_builder.dart';
import 'package:cash_manager/models/product.dart';
import 'package:flutter/material.dart';
import 'dart:math' as math;

class ProductTile extends StatefulWidget {
  /// The product informations to display
  final Product product;

  /// The function to call when the user clicks on the product
  final void Function(Product)? onTap;

  /// The function to call when the wants to delete the product
  final void Function(Product)? onDelete;
  const ProductTile({
    Key? key,
    required this.product,
    this.onTap,
    this.onDelete,
  }) : super(key: key);

  @override
  _ProductTileState createState() => _ProductTileState();
}

class _ProductTileState extends State<ProductTile>
    with TickerProviderStateMixin {
  late AnimationController _controller;
  double dir = 0;
  Color borderColor = Colors.black;

  @override
  void initState() {
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
    );
    super.initState();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  onSlide(DragUpdateDetails details) {
    if (details.primaryDelta == null || details.primaryDelta == 0) {
      return;
    }

    if (dir < 0 && details.primaryDelta! > 0 ||
        dir > 0 && details.primaryDelta! < 0) {
      _controller.reverse().then((value) {
        dir = 0;
      });
      return;
    }

    if (details.primaryDelta! < 0) {
      dir = -1;
      _controller.forward();
    } else if (details.primaryDelta! > 0) {
      dir = 1;
      _controller.forward();
    }
  }

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierBuilder(
      notifier: widget.product,
      builder: (context, product) {
        return Stack(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(4, 2, 4, 2),
              child: Card(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  color: Colors.red,
                  elevation: 8,
                  child: Row(
                    children: [
                      Container(
                        height: 100,
                        width: 50,
                        decoration: const BoxDecoration(
                          borderRadius: BorderRadius.only(
                            topLeft: Radius.circular(16),
                            bottomLeft: Radius.circular(16),
                          ),
                        ),
                        child: IconButton(
                          onPressed: () {
                            widget.onDelete?.call(widget.product);
                          },
                          icon: const Icon(
                            Icons.delete,
                            color: Colors.black,
                          ),
                        ),
                      ),
                      Expanded(child: Container()),
                      Container(
                        height: 100,
                        width: 50,
                        decoration: const BoxDecoration(
                          borderRadius: BorderRadius.only(
                            topRight: Radius.circular(16),
                            bottomRight: Radius.circular(16),
                          ),
                        ),
                        child: IconButton(
                          onPressed: () {
                            widget.onDelete?.call(widget.product);
                          },
                          icon: const Icon(
                            Icons.delete,
                            color: Colors.black,
                          ),
                        ),
                      ),
                    ],
                  )),
            ),
            GestureDetector(
              onTap: () {
                widget.onTap?.call(widget.product);
              },
              onHorizontalDragUpdate: onSlide,
              child: AnimatedBuilder(
                animation: _controller,
                builder: (context, child) {
                  return Transform.translate(
                    offset: Offset(
                      _controller.value * 50 * dir,
                      0,
                    ),
                    child: child,
                  );
                },
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(4, 2, 4, 2),
                  child: Card(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 8,
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: const BorderRadius.all(
                          Radius.circular(16),
                        ),
                        border: Border.all(
                          color: Theme.of(context).cardColor,
                          width: 1,
                        ),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            flex: 1,
                            child: SizedBox(
                              height: 100,
                              child: Padding(
                                padding: const EdgeInsets.all(8.0),
                                child: widget.product.image != null
                                    ? CachedNetworkImage(
                                        height: 100,
                                        imageUrl: widget.product.image!,
                                        placeholder: (context, child) =>
                                            const CircularProgressIndicator(),
                                      )
                                    : const Placeholder(),
                              ),
                            ),
                          ),
                          Expanded(
                            flex: 3,
                            child: Padding(
                              padding: const EdgeInsets.all(8.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    widget.product.name ?? '<no name>',
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  Text(
                                    widget.product.brand ?? '',
                                    style:
                                        Theme.of(context).textTheme.subtitle1,
                                  ),
                                ],
                              ),
                            ),
                          ),
                          Expanded(
                            flex: 1,
                            child: SizedBox(
                              height: 100,
                              child: Center(
                                child: FittedBox(
                                  fit: BoxFit.contain,
                                  child: Text(
                                    '${widget.product.quantity}x${widget.product.price}€',
                                    style: const TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          Row(
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                mainAxisAlignment: MainAxisAlignment.center,
                                mainAxisSize: MainAxisSize.max,
                                children: [
                                  Container(
                                    height: 50,
                                    decoration: BoxDecoration(
                                        borderRadius: const BorderRadius.only(
                                          topRight: Radius.circular(16),
                                        ),
                                        color: Colors.black.withOpacity(0.1)),
                                    child: IconButton(
                                      onPressed: () {
                                        if (widget.product.quantity < 99) {
                                          widget.product.quantity++;
                                          widget.product.notify();
                                        }
                                      },
                                      icon: const Icon(
                                        Icons.add,
                                        color: Colors.green,
                                      ),
                                    ),
                                  ),
                                  Container(
                                    height: 50,
                                    decoration: BoxDecoration(
                                      borderRadius: const BorderRadius.only(
                                        bottomRight: Radius.circular(16),
                                      ),
                                      color: Colors.black.withOpacity(0.1),
                                    ),
                                    child: IconButton(
                                      onPressed: () {
                                        if (widget.product.quantity > 1) {
                                          widget.product.quantity--;
                                          widget.product.notify();
                                        }
                                      },
                                      icon: const Icon(
                                        Icons.remove,
                                        color: Colors.red,
                                      ),
                                    ),
                                  )
                                ],
                              ),
                            ],
                          )
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}
