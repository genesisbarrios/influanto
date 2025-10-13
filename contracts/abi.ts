export const CONTRACT_ABI = {
  "source": {
    "hash": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "language": "ink! 4.0.0",
    "compiler": "rustc 1.68.0"
  },
  "contract": {
    "name": "music_nft",
    "version": "1.0.0",
    "authors": ["Influanto Team"]
  },
  "spec": {
    "constructors": [
      {
        "args": [],
        "default": false,
        "docs": [],
        "label": "new",
        "payable": false,
        "returnType": {
          "displayName": ["ink_primitives", "ConstructorResult"],
          "type": 0
        },
        "selector": "0x9bae9d5e"
      }
    ],
    "docs": [],
    "events": [
      {
        "args": [
          {
            "docs": [],
            "indexed": true,
            "label": "id",
            "type": {
              "displayName": ["u256"],
              "type": 1
            }
          },
          {
            "docs": [],
            "indexed": true,
            "label": "creator",
            "type": {
              "displayName": ["AccountId"],
              "type": 2
            }
          },
          {
            "docs": [],
            "indexed": false,
            "label": "price",
            "type": {
              "displayName": ["Balance"],
              "type": 3
            }
          },
          {
            "docs": [],
            "indexed": false,
            "label": "max_editions",
            "type": {
              "displayName": ["u32"],
              "type": 4
            }
          }
        ],
        "docs": [],
        "label": "TokenMinted"
      },
      {
        "args": [
          {
            "docs": [],
            "indexed": true,
            "label": "id",
            "type": {
              "displayName": ["u256"],
              "type": 1
            }
          },
          {
            "docs": [],
            "indexed": true,
            "label": "buyer",
            "type": {
              "displayName": ["AccountId"],
              "type": 2
            }
          },
          {
            "docs": [],
            "indexed": false,
            "label": "edition",
            "type": {
              "displayName": ["u32"],
              "type": 4
            }
          },
          {
            "docs": [],
            "indexed": false,
            "label": "price",
            "type": {
              "displayName": ["Balance"],
              "type": 3
            }
          }
        ],
        "docs": [],
        "label": "TokenBought"
      }
    ],
    "lang_error": {
      "displayName": ["ink", "LangError"],
      "type": 5
    },
    "messages": [
      {
        "args": [],
        "default": false,
        "docs": ["Get the next token ID"],
        "label": "nextId",
        "mutates": false,
        "payable": false,
        "returnType": {
          "displayName": ["Result"],
          "type": 6
        },
        "selector": "0x61b8ce8c"
      },
      {
        "args": [],
        "default": false,
        "docs": ["Get the contract owner"],
        "label": "owner",
        "mutates": false,
        "payable": false,
        "returnType": {
          "displayName": ["Result"],
          "type": 7
        },
        "selector": "0x8da5cb5b"
      },
      {
        "args": [
          {
            "label": "hash",
            "type": {
              "displayName": ["String"],
              "type": 8
            }
          },
          {
            "label": "price",
            "type": {
              "displayName": ["Balance"],
              "type": 3
            }
          },
          {
            "label": "max_editions",
            "type": {
              "displayName": ["u32"],
              "type": 4
            }
          }
        ],
        "default": false,
        "docs": ["Mint a new music NFT"],
        "label": "mint",
        "mutates": true,
        "payable": false,
        "returnType": {
          "displayName": ["Result"],
          "type": 9
        },
        "selector": "0xcfdd9aa2"
      },
      {
        "args": [
          {
            "label": "id",
            "type": {
              "displayName": ["u256"],
              "type": 1
            }
          }
        ],
        "default": false,
        "docs": ["Buy an edition of a music NFT"],
        "label": "buy",
        "mutates": true,
        "payable": true,
        "returnType": {
          "displayName": ["Result"],
          "type": 10
        },
        "selector": "0xa06ab1ba"
      },
      {
        "args": [],
        "default": false,
        "docs": ["Withdraw pending earnings"],
        "label": "withdraw",
        "mutates": true,
        "payable": false,
        "returnType": {
          "displayName": ["Result"],
          "type": 11
        },
        "selector": "0x410fcc9d"
      },
      {
        "args": [
          {
            "label": "id",
            "type": {
              "displayName": ["u256"],
              "type": 1
            }
          }
        ],
        "default": false,
        "docs": ["Get token information"],
        "label": "getTokenInfo",
        "mutates": false,
        "payable": false,
        "returnType": {
          "displayName": ["Result"],
          "type": 12
        },
        "selector": "0x3b3d1b4d"
      },
      {
        "args": [
          {
            "label": "account",
            "type": {
              "displayName": ["AccountId"],
              "type": 2
            }
          }
        ],
        "default": false,
        "docs": ["Get pending balance for account"],
        "label": "getPendingBalance",
        "mutates": false,
        "payable": false,
        "returnType": {
          "displayName": ["Result"],
          "type": 13
        },
        "selector": "0x67f0e5b1"
      },
      {
        "args": [],
        "default": false,
        "docs": ["Get contract balance"],
        "label": "getContractBalance",
        "mutates": false,
        "payable": false,
        "returnType": {
          "displayName": ["Result"],
          "type": 14
        },
        "selector": "0x1f2698ab"
      }
    ]
  },
  "storage": {
    "root": {
      "layout": {
        "struct": {
          "fields": [
            {
              "layout": {
                "leaf": {
                  "key": "0x00000000",
                  "ty": 0
                }
              },
              "name": "next_id"
            }
          ],
          "name": "MusicNFT"
        }
      },
      "root_key": "0x00000000"
    }
  },
  "types": [
    {
      "id": 0,
      "type": {
        "def": {
          "variant": {
            "variants": [
              {
                "fields": [
                  {
                    "type": 18
                  }
                ],
                "index": 0,
                "name": "Ok"
              },
              {
                "fields": [
                  {
                    "type": 5
                  }
                ],
                "index": 1,
                "name": "Err"
              }
            ]
          }
        },
        "params": [
          {
            "name": "T",
            "type": 18
          },
          {
            "name": "E",
            "type": 5
          }
        ],
        "path": ["Result"]
      }
    },
    {
      "id": 1,
      "type": {
        "def": {
          "primitive": "u256"
        }
      }
    },
    {
      "id": 2,
      "type": {
        "def": {
          "composite": {
            "fields": [
              {
                "type": 15,
                "typeName": "[u8; 32]"
              }
            ]
          }
        },
        "path": ["ink_primitives", "types", "AccountId"]
      }
    },
    {
      "id": 3,
      "type": {
        "def": {
          "primitive": "u128"
        }
      }
    },
    {
      "id": 4,
      "type": {
        "def": {
          "primitive": "u32"
        }
      }
    },
    {
      "id": 5,
      "type": {
        "def": {
          "variant": {
            "variants": [
              {
                "fields": [
                  {
                    "type": 16
                  }
                ],
                "index": 0,
                "name": "CouldNotReadInput"
              }
            ]
          }
        },
        "path": ["ink", "LangError"]
      }
    },
    {
      "id": 6,
      "type": {
        "def": {
          "variant": {
            "variants": [
              {
                "fields": [
                  {
                    "type": 1
                  }
                ],
                "index": 0,
                "name": "Ok"
              },
              {
                "fields": [
                  {
                    "type": 5
                  }
                ],
                "index": 1,
                "name": "Err"
              }
            ]
          }
        },
        "params": [
          {
            "name": "T",
            "type": 1
          },
          {
            "name": "E",
            "type": 5
          }
        ],
        "path": ["Result"]
      }
    },
    {
      "id": 7,
      "type": {
        "def": {
          "variant": {
            "variants": [
              {
                "fields": [
                  {
                    "type": 2
                  }
                ],
                "index": 0,
                "name": "Ok"
              },
              {
                "fields": [
                  {
                    "type": 5
                  }
                ],
                "index": 1,
                "name": "Err"
              }
            ]
          }
        },
        "params": [
          {
            "name": "T",
            "type": 2
          },
          {
            "name": "E",
            "type": 5
          }
        ],
        "path": ["Result"]
      }
    },
    {
      "id": 8,
      "type": {
        "def": {
          "primitive": "str"
        }
      }
    },
    {
      "id": 9,
      "type": {
        "def": {
          "variant": {
            "variants": [
              {
                "fields": [
                  {
                    "type": 1
                  }
                ],
                "index": 0,
                "name": "Ok"
              },
              {
                "fields": [
                  {
                    "type": 5
                  }
                ],
                "index": 1,
                "name": "Err"
              }
            ]
          }
        },
        "params": [
          {
            "name": "T",
            "type": 1
          },
          {
            "name": "E",
            "type": 5
          }
        ],
        "path": ["Result"]
      }
    },
    {
      "id": 10,
      "type": {
        "def": {
          "variant": {
            "variants": [
              {
                "fields": [
                  {
                    "type": 4
                  }
                ],
                "index": 0,
                "name": "Ok"
              },
              {
                "fields": [
                  {
                    "type": 5
                  }
                ],
                "index": 1,
                "name": "Err"
              }
            ]
          }
        },
        "params": [
          {
            "name": "T",
            "type": 4
          },
          {
            "name": "E",
            "type": 5
          }
        ],
        "path": ["Result"]
      }
    },
    {
      "id": 11,
      "type": {
        "def": {
          "variant": {
            "variants": [
              {
                "fields": [
                  {
                    "type": 16
                  }
                ],
                "index": 0,
                "name": "Ok"
              },
              {
                "fields": [
                  {
                    "type": 5
                  }
                ],
                "index": 1,
                "name": "Err"
              }
            ]
          }
        },
        "params": [
          {
            "name": "T",
            "type": 16
          },
          {
            "name": "E",
            "type": 5
          }
        ],
        "path": ["Result"]
      }
    },
    {
      "id": 12,
      "type": {
        "def": {
          "variant": {
            "variants": [
              {
                "fields": [
                  {
                    "type": 19
                  }
                ],
                "index": 0,
                "name": "Ok"
              },
              {
                "fields": [
                  {
                    "type": 5
                  }
                ],
                "index": 1,
                "name": "Err"
              }
            ]
          }
        },
        "params": [
          {
            "name": "T",
            "type": 19
          },
          {
            "name": "E",
            "type": 5
          }
        ],
        "path": ["Result"]
      }
    },
    {
      "id": 13,
      "type": {
        "def": {
          "variant": {
            "variants": [
              {
                "fields": [
                  {
                    "type": 3
                  }
                ],
                "index": 0,
                "name": "Ok"
              },
              {
                "fields": [
                  {
                    "type": 5
                  }
                ],
                "index": 1,
                "name": "Err"
              }
            ]
          }
        },
        "params": [
          {
            "name": "T",
            "type": 3
          },
          {
            "name": "E",
            "type": 5
          }
        ],
        "path": ["Result"]
      }
    },
    {
      "id": 14,
      "type": {
        "def": {
          "variant": {
            "variants": [
              {
                "fields": [
                  {
                    "type": 3
                  }
                ],
                "index": 0,
                "name": "Ok"
              },
              {
                "fields": [
                  {
                    "type": 5
                  }
                ],
                "index": 1,
                "name": "Err"
              }
            ]
          }
        },
        "params": [
          {
            "name": "T",
            "type": 3
          },
          {
            "name": "E",
            "type": 5
          }
        ],
        "path": ["Result"]
      }
    },
    {
      "id": 15,
      "type": {
        "def": {
          "array": {
            "len": 32,
            "type": 17
          }
        }
      }
    },
    {
      "id": 16,
      "type": {
        "def": {
          "tuple": []
        }
      }
    },
    {
      "id": 17,
      "type": {
        "def": {
          "primitive": "u8"
        }
      }
    },
    {
      "id": 18,
      "type": {
        "def": {
          "tuple": []
        }
      }
    },
    {
      "id": 19,
      "type": {
        "def": {
          "tuple": [
            2,
            8,
            3,
            4,
            4,
            20
          ]
        }
      }
    },
    {
      "id": 20,
      "type": {
        "def": {
          "primitive": "bool"
        }
      }
    }
  ]
};