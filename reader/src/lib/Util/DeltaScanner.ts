import {Observable, ReplaySubject, Subject} from "rxjs";
import {scan, shareReplay} from "rxjs/operators";
import {uniq} from "lodash";
import {flattenNamedObject, Named} from "../Manager/OpenBooks";

export type ds_Dict<T, U extends string = string> = {
    [key in U]: T
}

export type ds_Tree<T, U extends string = string> = {
    value?: T;
    children?: ds_Dict<ds_Tree<T, U>>
    nodeLabel: U | 'root';
    delete?: boolean;
    // When applying a tree diff, you may want to say "Disregard all previous changes to this tree"
    newTree?: boolean;
}

/**
 * Maybe I should return a tree of deltas once I apply
 * Not now though
 * @param oldTree
 * @param diffTree
 */
function applyTreeDiff<T>(oldTree: ds_Tree<T> | undefined, diffTree: ds_Tree<T> | undefined): ds_Tree<T> | undefined {
    if (!oldTree && !diffTree) return undefined;
    if (!oldTree) return diffTree;
    if (!diffTree) return oldTree;
    if (diffTree?.delete) return undefined;
    if (diffTree.newTree) return diffTree;
    const allChildKeys = uniq(Object.keys(oldTree.children || {}).concat(Object.keys(diffTree.children || {})))
    const newChildren = Object.fromEntries(
        allChildKeys.map(key => {
                let oldTreeChild = oldTree.children?.[key];
                let newTreeChild = diffTree.children?.[key];
                const childNode = applyTreeDiff(oldTreeChild, newTreeChild);
                return [key, childNode];
            }
        ).filter(([key, childNode]) => childNode)
    );

    const ret: ds_Tree<T> = {
        nodeLabel: diffTree.nodeLabel,
        children: newChildren,
    };

    if (diffTree.hasOwnProperty('value')) {
        ret.value = diffTree.value;
    }
    return ret;

    /*
        oldTree.value = diffTree.value;
        // I could do it by returing new Nodes, but that might be slow?
        // Either way is pretty easy
        const newTreeChildren = diffTree.children || {};
        const oldTreeChildren = oldTree.children || {};
        Object.entries(newTreeChildren).forEach(([key, newNode]) => {
            // Assert the child exists, this part wouldn't exist if we were doign the new instantiating way, but screw it
            if (!oldTreeChildren[key]) {
                oldTreeChildren[key] = {
                    value: newNode.value,
                    children: {},
                    nodeLabel: newNode.nodeLabel
                };
            }
            applyTreeDiff(oldTreeChildren[key], newTreeChildren[key])
        })
    */
}

export type DeltaScan<T, U extends string = string> = {
    sourced: ds_Tree<T, U> | undefined,
    previousTree: ds_Tree<T, U> | undefined,
    delta: ds_Tree<T, U>
};
export type DeltaScanMapFunc<T, U> = (v: T) => U;
export type DeltaScanSubTreeFunc<T> = (v: ds_Tree<T>) => ds_Tree<T> | undefined;

// Right now we over-write things in the map, perhaps we want to merge them
export class DeltaScanner<T, U extends string = string> {
    // I dont think this needs to be a replaySubject, but lets see if this works
    appendDelta$ = new ReplaySubject<ds_Tree<T, U> | undefined>(1);
    updates$: Observable<DeltaScan<T, U>>;

    constructor() {
        // @ts-ignore
        this.updates$ = this.appendDelta$.pipe(
            // @ts-ignore
            scan((scan: DeltaScan<T, U> | undefined, delta: ds_Tree<T, U> | undefined) => {
                    if (!scan)
                        return {
                            sourced: delta,
                            delta
                        } as DeltaScan<T, U>;

                    return {
                        sourced: applyTreeDiff(scan.sourced, delta),
                        previousTree: scan.sourced,
                        delta
                    } as DeltaScan<T, U>;
                },
                undefined
            ),
            shareReplay(1)
        )
    }

    mapWith<U>(mapFunc: DeltaScanMapFunc<T, U>): DeltaScanner<U> {
        const derivedTree = new DeltaScanner<U>();
        this.updates$.subscribe(({delta}) => {
            derivedTree.appendDelta$.next(
                MapTree(delta, mapFunc)
            )
        })
        return derivedTree;
    }

    subTree(subTreeFunc: DeltaScanSubTreeFunc<T>): DeltaScanner<T> {
        const derivedTree = new DeltaScanner<T>();
        this.updates$.subscribe(({sourced}) => {
            if (sourced) {
                let newSubTree = subTreeFunc(sourced);
                if (newSubTree) {
                    newSubTree.newTree = true;
                }
                derivedTree.appendDelta$.next(newSubTree);
            }
            derivedTree.appendDelta$.next(sourced);
        })
        return derivedTree;
    }
}

export class NamedDeltaScanner<T extends Named, U extends string = string> extends DeltaScanner<T, U> {
    this.dict = this.updates$.pipe(flattenNamedObject('root'))
}

function MapTree<T, U>(node: ds_Tree<T>, mapFunc: DeltaScanMapFunc<T, U>): ds_Tree<U> {
    const newChildren = Object.fromEntries(
        Object.entries(node.children || {})
            .map(
                ([nodeLabel, child]) => {
                    return [
                        nodeLabel,
                        MapTree(child, mapFunc)
                    ]
                }
            )
    );
    if (node.hasOwnProperty('value')) {
        let value = mapFunc(node.value as T);
        return {
            nodeLabel: node.nodeLabel,
            children: newChildren,
            value: value
        }
    } else {
        // @ts-ignore
        return {
            nodeLabel: node.nodeLabel,
            children: newChildren,
        } as ds_Tree<T>
    }
}

export function flattenTree<T, U extends string = string>(tree: ds_Tree<T, U>, a: T[] = []): T[] {
    if (!tree) {
        throw new Error("Tree is undefined")
    }
    if (tree.hasOwnProperty('value')) {
        if (!tree.value) {
            throw new Error("Tree has no value")
        }
        a.push(tree.value as T);
    }
    Object.values(tree.children || {}).forEach(child => flattenTree(child, a))
    return a;
}

export function getElementByKeyPath<T, U extends string = string>(tree: ds_Tree<T, U>, keyPath: U[] = []): T {
    let n: ds_Tree<T> = tree;
    let i = 0;
    while (i < keyPath.length) {
        if (!n?.children) {
            throw new Error(`Could not follow keypath ${keyPath.join(',')}`)
        }
        n = n.children[keyPath[i]];
    }
    return n.value as T;
}

export function getDeletedValues<T>(tree: ds_Tree<T> | undefined, delta: ds_Tree<T>, a: T[] = []): T[] {
    if (delta.delete) {
        if (tree) {
            a.push(...flattenTree(tree));
        }
    }
    if (delta.children) {
        Object.entries(delta.children)
            .forEach(([key, child]) =>
                getDeletedValues(
                    tree?.children?.[key],
                    // @ts-ignore
                    delta.children[key] as ds_Tree<T>,
                    a
                )
            );
    }
    return a;
}

