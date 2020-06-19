import * as React from 'react';
import { TreeNode, TreeNodeComponent, defaultTreeNode } from './tree-node';
import { Message } from './message';

type FilterTreeProps = {
    nodes: TreeNode[];
    showCheckboxes: boolean;    
    checkedSeries: number[];                //Optional
    collapsedNodes: number[];
    onChecked: (ids: number[]) => void;     //Optional
    onCollapse: (id: number) => void;
}

export class FilterTree extends React.Component<FilterTreeProps> {
    static defaultProps: Partial<FilterTreeProps> = {
        checkedSeries: [],
        onChecked: () => {},
    }
    
    constructor(props: FilterTreeProps) {
        super(props);
    }

    getRootNodes = (): TreeNode[] => {
        const nodes = [...this.props.nodes];
        return nodes.filter((node: TreeNode) => node.isRoot === true);
    }

    getNode = (id: number): TreeNode | null => {
        let nodes: TreeNode[] = [...this.props.nodes];
        let currentNode: TreeNode;
        while(nodes.length) {
            currentNode = nodes.pop()!;
            if (currentNode.id === id) {
                return currentNode;
            } else {
                if (currentNode.children && currentNode.children.length) {
                    currentNode.children.forEach((child: TreeNode) => {
                        nodes.push(child);
                    })
                }
            }
        }
        return null;
    }

    handleCollapse = (id: number): void => {
        this.props.onCollapse(id);
    }

    getAllChildrenIds = (node: TreeNode, ids: number[]): number[] => {
        ids.push(node.id);
        if (node.children.length) {
            node.children.forEach((child: TreeNode) => {
                this.getAllChildrenIds(child, ids);
            })
        }
        return ids;
    }

    isNodeChecked = (id: number): boolean => {
        return this.props.checkedSeries.includes(id);
    }

    areAllSiblingsChecked = (node: TreeNode): boolean => {
        const parentNode = this.getNode(node.parentId);
        if (parentNode) {
            return parentNode.children.every((child: TreeNode) => {
                return this.isNodeChecked(child.id) || node.id === child.id;
            });
        }  
        return false;      
    }

    handleCheck = (id: number): void => {
        let checkedIds: number[] = [];
        const checkedNode = this.getNode(id);
        if (checkedNode) {
            if (checkedNode.children.length) {
                const childrenIds = this.getAllChildrenIds(checkedNode, []);
                if (this.isNodeChecked(id)) {
                    checkedIds = checkedIds.concat(childrenIds)
                } else {
                    const childIdsToCheck = childrenIds.filter(id => {
                        return !this.isNodeChecked(id);
                    });
                    checkedIds = checkedIds.concat(childIdsToCheck);
                }
            } else {
                checkedIds.push(id);
                if (this.areAllSiblingsChecked(checkedNode)) {
                    checkedIds.push(checkedNode.parentId);
                }
            }
            this.props.onChecked(checkedIds);
        }
    }

    //returns 0 for unchecked, 1 for checked, 2 for half checked
    getCheckedStatus = (id: number): number => {
        const node = this.getNode(id);
        if (node) {
            if (node.children.length === 0) {
                return this.isNodeChecked(id) ? 1 : 0;
            } else {
                if (this.isEveryChildChecked(node)) {
                    return 1;
                }
                if (this.isSomeChildChecked(node)) {
                    return 2;
                }
            }
        }
        return 0;
    }

    isEveryChildChecked = (node: TreeNode): boolean => {
        return node.children.every((child: TreeNode) => {
            return this.isNodeChecked(child.id);
        })
    }

    isSomeChildChecked = (node: TreeNode): boolean => {
        return node.children.some((child: TreeNode) => {
            return this.isNodeChecked(child.id);
        })
    }

    isCollapsed = (id: number): boolean => {
        return this.props.collapsedNodes.includes(id);
    }

    renderTreeNodes = (nodes: TreeNode[], parent: TreeNode = defaultTreeNode, level: number = 0): JSX.Element | null => {
        const treeNodes = nodes.map((node: TreeNode) => {
            const children = node.children.length > 0 ? this.renderTreeNodes(node.children, node, level+1) : null;
            const checkedStatus = this.getCheckedStatus(node.id);

            if (!node.isRoot && this.isCollapsed(node.parentId)) {
                return null;
            }
            return (
                <TreeNodeComponent 
                    node={node}
                    key={'node-'+node.id}
                    level={level}
                    padding={15}
                    checkedStatus={checkedStatus}
                    collapsed={this.isCollapsed(node.id)}
                    isCheckable={this.props.showCheckboxes}
                    onCollapsed={this.handleCollapse}
                    onChecked={this.handleCheck}
                >
                    {children}
                </TreeNodeComponent>
            )
        });
        return (
            <ul style={{margin: 0, listStyleType: 'none', padding: 0}}>
                {treeNodes}
            </ul>
        )
    }

    render() {
        if (!this.props.nodes) return null;
        const rootNodes = this.getRootNodes();
        if (rootNodes && rootNodes.length) {
            return this.renderTreeNodes(rootNodes);
        } else {
            return <Message></Message>;
        }
    }
}