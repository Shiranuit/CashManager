import 'package:cached_network_image/cached_network_image.dart';
import 'package:cash_manager/components/change_notifier_builder.dart';
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
    return ChangeNotifierBuilder(
      notifier: widget.product,
      builder: (context, product) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(4, 2, 4, 2),
          child: Card(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            elevation: 8,
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
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          widget.product.brand ?? '',
                          style: Theme.of(context).textTheme.subtitle1,
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
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  flex: 1,
                  child: SizedBox(
                    height: 100,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.max,
                      children: [
                        Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.only(
                              topRight: Radius.circular(16),
                            ),
                            color: Colors.green[400],
                          ),
                          child: IconButton(
                            onPressed: () {
                              if (widget.product.quantity < 99) {
                                widget.product.quantity++;
                                widget.product.notify();
                              }
                            },
                            icon: Icon(Icons.add),
                          ),
                        ),
                        Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.only(
                              bottomRight: Radius.circular(16),
                            ),
                            color: Colors.red[400],
                          ),
                          child: IconButton(
                            onPressed: () {
                              if (widget.product.quantity > 1) {
                                widget.product.quantity--;
                                widget.product.notify();
                              }
                            },
                            icon: Icon(Icons.remove),
                          ),
                        )
                      ],
                    ),
                  ),
                )
              ],
            ),
          ),
        );
      },
    );
  }
}
