class SampleDriver

    def self.page(clz, *args)
        clz.new(self, *args)
    end

    def self.start_survey
        page(MenuScreen).await()
            .select_survey()
            .fillout_site_details()
            .fillout_habitat_details()
    end

    def self.add_taxon_via_browse( taxonName )
        page(SampleTrayScreen).await()
            .start_identification()
            .browse()
            .choose_taxon(taxonName)
            .add_to_sample()
            .save()
    end

    def self.submit_sample
        current_page = page(SampleTrayScreen).await()
            .submit_sample()
            .done()
    end


end