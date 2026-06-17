# TODO List for Site Generator

## Wave Function Collapse Castle Generation

### Phase 1: Research & Planning
- [ ] Research WFC algorithm fundamentals and variants
- [ ] Review Excalibur.js tilemap documentation
- [ ] Design castle tile patterns and constraints
- [ ] Define tile types (ground, wall, roof, door, window, etc.)

### Phase 2: Data Structures & Types
- [ ] Create TileType enum (ground, wall, roof, door, window, floor, etc.)
- [ ] Define TilePattern interface with valid neighbors
- [ ] Create TileConstraint interface for adjacency rules
- [ ] Define TileState interface for collapsed tiles
- [ ] Implement NeighborConstraint type for valid neighbor configurations

### Phase 3: Core WFC Algorithm
- [ ] Implement WaveFunctionCollapse class
- [ ] Create entropy calculation method
- [ ] Implement collapse() method for selecting lowest entropy tile
- [ ] Add propagate() method for neighbor constraint propagation
- [ ] Implement get_valid_neighbors() for checking valid tile placements
- [ ] Add get_entropy() method for entropy calculation
- [ ] Implement get_lowest_entropy() for tile selection

### Phase 4: Tile Pattern Definitions
- [ ] Define castle wall patterns (straight, corner, T-junction, etc.)
- [ ] Create roof patterns (flat, peaked, gabled)
- [ ] Add door and window patterns
- [ ] Define floor patterns (interior, exterior)
- [ ] Create special patterns (stairs, ramps, decorations)

### Phase 5: Castle Generation Logic
- [ ] Implement castle seed placement (center or corner)
- [ ] Add castle wall generation algorithm
- [ ] Create roof placement logic
- [ ] Implement door and window placement
- [ ] Add interior floor generation
- [ ] Create castle entrance/exit logic
- [ ] Implement castle size variation (small, medium, large)

### Phase 6: Integration with Excalibur
- [ ] Create 65x65 TileMap class for WFC output
- [ ] Create the SpriteSheet and Resources for tiles
- [ ] Implement tile rendering in Excalibur Scene
- [ ] Add tilemap export to resources.ts
- [ ] Create tilemap loading from WFC output
- [ ] Add tilemap collision detection
- [ ] Implement tilemap camera/viewport handling

### Phase 7: Testing & Refinement
- [ ] Test WFC algorithm with small tilemaps (10x10)
- [ ] Verify castle generation produces valid structures
- [ ] Test edge cases (single tile, all tiles collapsed)
- [ ] Add error handling for impossible configurations
- [ ] Optimize performance for 65x65 tilemap
- [ ] Add castle variety (different styles, sizes)
- [ ] Test with different random seeds
- [ ] Verify tilemap fits within viewport

### Phase 8: Documentation
- [ ] Document WFC algorithm implementation
- [ ] Add comments for complex WFC logic
- [ ] Create usage examples for castle generation
- [ ] Document tile pattern definitions
- [ ] Add troubleshooting guide for common issues
